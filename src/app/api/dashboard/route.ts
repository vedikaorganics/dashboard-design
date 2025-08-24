import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET() {
  try {
    // Check cache first
    const cached = cache.get(cacheKeys.dashboard)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Parallel execution for maximum performance
    const [ordersCollection, usersCollection, reviewsCollection] = await Promise.all([
      getCollection('orders'),
      getCollection('users'),
      getCollection('reviews')
    ])

    // Execute all queries in parallel
    const [
      totalRevenue,
      totalOrders,
      totalUsers,
      totalReviews,
      last30DaysOrders,
      orderStatusCounts,
      confirmedOrdersCount,
      averageRating,
      pendingReviews,
      customerOrderCounts
    ] = await Promise.all([
      // Total revenue (only from confirmed orders with payment)
      ordersCollection.aggregate([
        { 
          $match: { 
            $or: [
              { paymentStatus: 'PAID' },
              { paymentStatus: 'CASH_ON_DELIVERY' }
            ]
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).toArray(),

      // Total orders
      ordersCollection.countDocuments(),

      // Total users
      usersCollection.countDocuments(),

      // Total reviews
      reviewsCollection.countDocuments(),

      // Last 30 days orders (only confirmed orders for revenue calculation)
      ordersCollection.find({
        createdAt: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        },
        $or: [
          { paymentStatus: 'PAID' },
          { paymentStatus: 'CASH_ON_DELIVERY' }
        ]
      }).toArray(),

      // Order status counts
      ordersCollection.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]).toArray(),

      // Confirmed orders count (based on payment status)
      ordersCollection.countDocuments({
        $or: [
          { paymentStatus: 'PAID' },
          { paymentStatus: 'CASH_ON_DELIVERY' }
        ]
      }),

      // Average rating
      reviewsCollection.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).toArray(),

      // Pending reviews count
      reviewsCollection.countDocuments({ isApproved: false }),

      // Customer order distribution
      ordersCollection.aggregate([
        { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
        { $group: { _id: '$orderCount', customerCount: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).toArray()
    ])

    // Calculate MRR (last 30 days revenue)
    const mrr = last30DaysOrders.reduce((sum, order) => sum + order.amount, 0)

    // Process order status counts
    const statusMap = orderStatusCounts.reduce((acc, status) => {
      acc[status._id] = status.count
      return acc
    }, {} as Record<string, number>)

    // Customer order distribution data
    const customerOrderDistributionData = customerOrderCounts.map(item => ({
      name: `${item._id} order${item._id === 1 ? '' : 's'}`,
      value: item.customerCount
    }))

    const dashboardData = {
      totalRevenue: totalRevenue[0]?.total || 0,
      totalOrders,
      totalUsers,
      totalReviews,
      mrr,
      last30DaysOrderCount: last30DaysOrders.length,
      confirmedOrders: confirmedOrdersCount, // Now based on payment status
      pendingOrders: statusMap.PENDING || 0,
      averageRating: averageRating[0]?.avgRating || 0,
      pendingReviews,
      customerOrderDistributionData,
      avgOrderValue: last30DaysOrders.length > 0 ? mrr / last30DaysOrders.length : 0
    }

    // Cache for 5 minutes (dashboard updates frequently)
    cache.set(cacheKeys.dashboard, dashboardData, 300)

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}