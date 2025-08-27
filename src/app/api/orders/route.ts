import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache } from '@/lib/cache'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 Orders API: Request started')
  
  try {
    // Validate session for security
    const authStart = Date.now()
    const session = await auth.api.getSession({ headers: request.headers })
    console.log(`🔐 Orders API: Auth check completed in ${Date.now() - authStart}ms`)
    
    if (!session?.user) {
      console.log('❌ Orders API: Unauthorized request')
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
    const cacheStart = Date.now()
    const cached = cache.get(cacheKey)
    console.log(`💾 Orders API: Cache check completed in ${Date.now() - cacheStart}ms`)
    
    if (cached) {
      console.log(`✅ Orders API: Cache hit! Total time: ${Date.now() - startTime}ms`)
      return NextResponse.json(cached)
    }
    console.log('🔄 Orders API: Cache miss, executing query')

    const collectionStart = Date.now()
    const ordersCollection = await getCollection('orders')
    console.log(`🗃️ Orders API: Collection obtained in ${Date.now() - collectionStart}ms`)

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

    // Execute single aggregation with user data join
    const queryStart = Date.now()
    const [ordersResult] = await Promise.all([
      ordersCollection.aggregate([
        {
          $facet: {
            // Main orders data with user lookup
            orders: [
              { $match: filter },
              { $sort: { createdAt: -1 } },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: 'userId',
                  as: 'user'
                }
              },
              {
                $addFields: {
                  user: { $arrayElemAt: ['$user', 0] }
                }
              }
            ],
            // Total count for pagination
            totalCount: [
              { $match: filter },
              { $count: 'count' }
            ],
            // Summary statistics (unfiltered)
            summary: [
              {
                $group: {
                  _id: null,
                  paymentPending: {
                    $sum: { $cond: [{ $eq: ['$paymentStatus', 'PENDING'] }, 1, 0] }
                  },
                  shippingPending: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $in: ['$paymentStatus', ['PAID', 'CASH_ON_DELIVERY']] },
                            { $eq: ['$deliveryStatus', 'PENDING'] }
                          ]
                        },
                        1,
                        0
                      ]
                    }
                  },
                  inTransit: {
                    $sum: { $cond: [{ $eq: ['$deliveryStatus', 'SHIPPED'] }, 1, 0] }
                  }
                }
              }
            ]
          }
        }
      ]).toArray()
    ])
    console.log(`📊 Orders API: Aggregation query completed in ${Date.now() - queryStart}ms`)

    // Extract results from aggregation
    const result = ordersResult[0]
    const orders = result.orders || []
    const totalCount = result.totalCount[0]?.count || 0
    const summaryData = result.summary[0] || {
      paymentPending: 0,
      shippingPending: 0,
      inTransit: 0
    }

    const finalResult = {
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      summary: {
        paymentPending: summaryData.paymentPending,
        shippingPending: summaryData.shippingPending,
        inTransit: summaryData.inTransit
      }
    }

    // Cache for 90 seconds (optimized queries allow shorter cache)
    const cacheSetStart = Date.now()
    cache.set(cacheKey, finalResult, 90)
    console.log(`💾 Orders API: Data cached in ${Date.now() - cacheSetStart}ms`)
    
    const totalTime = Date.now() - startTime
    console.log(`✅ Orders API: Request completed successfully in ${totalTime}ms`)
    
    return NextResponse.json(finalResult)
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`❌ Orders API error after ${errorTime}ms:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}