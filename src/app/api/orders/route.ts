import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { cache } from '@/lib/cache'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const paymentStatus = searchParams.get('paymentStatus')?.split(',') || undefined
    const deliveryStatus = searchParams.get('deliveryStatus')?.split(',') || undefined

    // Create cache key that includes all filter parameters
    const filterParams = {
      status,
      search,
      paymentStatus: paymentStatus?.sort().join(','),
      deliveryStatus: deliveryStatus?.sort().join(',')
    }
    const cacheKey = `orders-${page}-${limit}-${JSON.stringify(filterParams)}`
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const ordersCollection = await getCollection('orders')
    const usersCollection = await getCollection('users')

    // Build filter
    const filter: Record<string, unknown> = {}
    
    // Status filter (existing)
    if (status && status !== 'all') {
      filter.orderStatus = status
    }
    
    // Payment status filter
    if (paymentStatus && paymentStatus.length > 0) {
      filter.paymentStatus = { $in: paymentStatus }
    }
    
    // Delivery status filter
    if (deliveryStatus && deliveryStatus.length > 0) {
      filter.deliveryStatus = { $in: deliveryStatus }
    }
    
    // Search filter - search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      const searchNumber = parseFloat(search.trim())
      
      filter.$or = [
        // Search in Order ID
        { orderId: searchRegex },
        
        // Search in address fields (customer name)
        { 'address.firstName': searchRegex },
        { 'address.lastName': searchRegex },
        
        // Search in UTM parameters
        { 'utmParams.utm_source': searchRegex },
        { 'utmParams.utm_medium': searchRegex },
        { 'utmParams.utm_campaign': searchRegex },
        { 'utmParams.utm_term': searchRegex },
        { 'utmParams.utm_content': searchRegex },
        
        // Search in amount (if search term is numeric)
        ...(isNaN(searchNumber) ? [] : [
          { totalAmount: searchNumber },
          { amount: searchNumber }
        ])
      ]
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