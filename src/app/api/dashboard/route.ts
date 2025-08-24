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
      previous30DaysOrders,
      last30DaysUsers,
      previous30DaysUsers,
      last30DaysReviews,
      previous30DaysReviews,
      orderStatusCounts,
      confirmedOrdersCount,
      averageRating,
      pendingReviews,
      customerOrderCounts,
      ordersToShip,
      dailyRevenueData
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

      // Previous 30 days orders (days 31-60 ago, only confirmed orders)
      ordersCollection.find({
        createdAt: { 
          $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        $or: [
          { paymentStatus: 'PAID' },
          { paymentStatus: 'CASH_ON_DELIVERY' }
        ]
      }).toArray(),

      // Last 30 days users
      usersCollection.find({
        createdAt: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        }
      }).toArray(),

      // Previous 30 days users (days 31-60 ago)
      usersCollection.find({
        createdAt: { 
          $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }).toArray(),

      // Last 30 days reviews
      reviewsCollection.find({
        createdAt: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        }
      }).toArray(),

      // Previous 30 days reviews (days 31-60 ago)
      reviewsCollection.find({
        createdAt: { 
          $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
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
      ]).toArray(),

      // Orders that need to be shipped (confirmed orders with pending delivery)
      ordersCollection.countDocuments({
        $or: [
          { paymentStatus: 'PAID' },
          { paymentStatus: 'CASH_ON_DELIVERY' }
        ],
        deliveryStatus: 'PENDING'
      }),

      // Daily revenue data for all time (for 30-day moving average)
      ordersCollection.aggregate([
        {
          $match: {
            $or: [
              { paymentStatus: 'PAID' },
              { paymentStatus: 'CASH_ON_DELIVERY' }
            ]
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata"
              }
            },
            revenue: { $sum: "$amount" }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray()
    ])

    // Calculate MRR (last 30 days revenue)
    const mrr = last30DaysOrders.reduce((sum, order) => sum + order.amount, 0)
    const previousMrr = previous30DaysOrders.reduce((sum, order) => sum + order.amount, 0)

    // Calculate growth rates
    const revenueGrowth = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0
    const ordersGrowth = previous30DaysOrders.length > 0 ? ((last30DaysOrders.length - previous30DaysOrders.length) / previous30DaysOrders.length) * 100 : 0
    const usersGrowth = previous30DaysUsers.length > 0 ? ((last30DaysUsers.length - previous30DaysUsers.length) / previous30DaysUsers.length) * 100 : 0
    const reviewsGrowth = previous30DaysReviews.length > 0 ? ((last30DaysReviews.length - previous30DaysReviews.length) / previous30DaysReviews.length) * 100 : 0

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

    // Process daily revenue data with 30-day moving average
    const revenueByDate = new Map()
    dailyRevenueData.forEach(item => {
      revenueByDate.set(item._id, item.revenue)
    })

    // Get all unique dates and sort them
    const allDates = Array.from(revenueByDate.keys()).sort()
    const dailyRevenueChart: any[] = []

    // Calculate 30-day moving average for each date
    allDates.forEach((dateStr, index) => {
      // Calculate 30-day moving average (looking back 29 days + current day)
      let movingAvgSum = 0
      let movingAvgCount = 0
      
      for (let j = Math.max(0, index - 29); j <= index; j++) {
        const avgDateStr = allDates[j]
        const avgRevenue = revenueByDate.get(avgDateStr) || 0
        movingAvgSum += avgRevenue
        movingAvgCount++
      }
      
      const movingAverage = movingAvgCount > 0 ? movingAvgSum / movingAvgCount : 0
      
      // Format date for display
      const displayDate = new Date(dateStr)
      const name = displayDate.toLocaleDateString('en-IN', { 
        day: '2-digit',
        month: 'short',
        year: allDates.length > 365 ? '2-digit' : undefined // Show year if more than a year of data
      })
      
      dailyRevenueChart.push({
        date: dateStr,
        name: name,
        mrr: movingAverage
      })
    })

    const dashboardData = {
      // Revenue data (all-time total with growth based on last 30 days)
      totalRevenue: totalRevenue[0]?.total || 0, // Back to all-time total
      revenueGrowth,
      
      // Orders data (all-time total with growth based on last 30 days)
      totalOrders, // Back to all-time total
      ordersGrowth,
      confirmedOrders: confirmedOrdersCount,
      pendingOrders: statusMap.PENDING || 0,
      
      // Users data (all-time total with growth based on last 30 days)
      totalUsers, // Back to all-time total
      usersGrowth,
      
      // Reviews data (all-time total with growth based on last 30 days)
      totalReviews, // Back to all-time total
      reviewsGrowth,
      averageRating: averageRating[0]?.avgRating || 0,
      pendingReviews,
      
      // Additional data
      customerOrderDistributionData,
      avgOrderValue: last30DaysOrders.length > 0 ? mrr / last30DaysOrders.length : 0,
      
      // Quick Actions data
      ordersToShip,
      
      // Chart data
      dailyRevenueChart
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