import { NextRequest, NextResponse } from 'next/server'
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
    const [orders, totalCount] = await Promise.all([
      ordersCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      ordersCollection.countDocuments(filter)
    ])

    // Get user data for orders (batch fetch for performance)
    const userIds = [...new Set(orders.map(order => order.userId))]
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .toArray()
    
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user
      return acc
    }, {} as Record<string, unknown>)

    // Enrich orders with user data
    const enrichedOrders = orders.map(order => ({
      ...order,
      user: userMap[order.userId.toString()]
    }))

    const result = {
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
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