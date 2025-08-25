import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || undefined

    // Check cache first
    const cacheKey = cacheKeys.orders(page, limit, status)
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const ordersCollection = await getCollection('orders')
    const usersCollection = await getCollection('users')

    // Build filter
    const filter: Record<string, unknown> = {}
    if (status && status !== 'all') {
      filter.orderStatus = status
    }

    // Execute queries in parallel
    const [orders, totalCount, summaryData] = await Promise.all([
      ordersCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      ordersCollection.countDocuments(filter),
      // Get summary counts for KPI cards (always from full dataset, not filtered)
      ordersCollection.aggregate([
        {
          $group: {
            _id: null,
            paymentPending: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "PENDING"] }, 1, 0] }
            },
            shippingPending: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $or: [{ $eq: ["$paymentStatus", "PAID"] }, { $eq: ["$paymentStatus", "CASH_ON_DELIVERY"] }] },
                      { $eq: ["$deliveryStatus", "PENDING"] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            inTransit: {
              $sum: { $cond: [{ $eq: ["$deliveryStatus", "SHIPPED"] }, 1, 0] }
            }
          }
        }
      ]).toArray()
    ])

    // Get user data for orders (batch fetch for performance)
    const userIds = [...new Set(orders.map(order => order.userId))]
    const users = await usersCollection
      .find({ 
        $or: [
          { _id: { $in: userIds.map(id => {
            try {
              return new ObjectId(id)
            } catch {
              return id
            }
          }) } },
          { userId: { $in: userIds } }
        ]
      })
      .toArray()
    
    const userMap = users.reduce((acc, user) => {
      // Map by both _id and userId for compatibility
      acc[user._id.toString()] = user
      if (user.userId) {
        acc[user.userId] = user
      }
      return acc
    }, {} as Record<string, unknown>)

    // Enrich orders with user data
    const enrichedOrders = orders.map(order => ({
      ...order,
      user: userMap[order.userId.toString()]
    }))

    // Extract summary data (default to 0 if no data)
    const summary = summaryData[0] || {
      paymentPending: 0,
      shippingPending: 0,
      inTransit: 0
    }

    const result = {
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      summary: {
        paymentPending: summary.paymentPending,
        shippingPending: summary.shippingPending,
        inTransit: summary.inTransit
      }
    }

    // Cache for 2 minutes (orders change frequently)
    cache.set(cacheKey, result, 120)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}