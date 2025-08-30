import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get collections
    const [ordersCollection, usersCollection, reviewsCollection] = await Promise.all([
      getCollection('orders'),
      getCollection('users'),
      getCollection('reviews')
    ])

    // Execute consolidated queries in parallel for better performance
    
    // Track individual query performance with detailed timing
    const [
      ordersAnalytics,
      usersAnalytics, 
      reviewsAnalytics,
      consolidatedRevenueData
    ] = await Promise.all([
      // Orders Analytics Query
      (async () => {
        const result = await ordersCollection.aggregate([
        {
          $facet: {
            // All-time totals and confirmed orders
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalRevenue: {
                    $sum: {
                      $cond: [
                        { $in: ['$paymentStatus', ['PAID', 'CASH_ON_DELIVERY']] },
                        '$amount',
                        0
                      ]
                    }
                  },
                  totalOrders: {
                    $sum: {
                      $cond: [
                        { $in: ['$paymentStatus', ['PAID', 'CASH_ON_DELIVERY']] },
                        1,
                        0
                      ]
                    }
                  },
                  ordersToShip: {
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
                  }
                }
              }
            ],
            // Order status distribution
            statusCounts: [
              { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
            ],
            // Date-based analytics (last 60 days)
            dateAnalytics: [
              {
                $match: {
                  createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
                  $or: [{ paymentStatus: 'PAID' }, { paymentStatus: 'CASH_ON_DELIVERY' }]
                }
              },
              {
                $group: {
                  _id: {
                    period: {
                      $cond: [
                        { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                        'last30',
                        'previous30'
                      ]
                    }
                  },
                  count: { $sum: 1 },
                  revenue: { $sum: '$amount' },
                  orders: { $push: '$$ROOT' }
                }
              }
            ],
            // Customer order distribution
            customerDistribution: [
              {
                $match: {
                  $or: [{ paymentStatus: 'PAID' }, { paymentStatus: 'CASH_ON_DELIVERY' }]
                }
              },
              { $group: { _id: '$userId', orderCount: { $sum: 1 } } },
              { $group: { _id: '$orderCount', customerCount: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]).toArray()
        return result
      })(),

      // Users Analytics Query
      (async () => {
        const result = await usersCollection.aggregate([
        {
          $facet: {
            totalUsers: [
              {
                $match: { phoneNumberVerified: true }
              },
              { $count: 'count' }
            ],
            dateAnalytics: [
              {
                $match: {
                  phoneNumberVerified: true,
                  createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
                }
              },
              {
                $group: {
                  _id: {
                    period: {
                      $cond: [
                        { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                        'last30',
                        'previous30'
                      ]
                    }
                  },
                  count: { $sum: 1 },
                  users: { $push: '$$ROOT' }
                }
              }
            ]
          }
        }
      ]).toArray()
        return result
      })(),

      // Reviews Analytics Query
      (async () => {
        const result = await reviewsCollection.aggregate([
        {
          $facet: {
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalReviews: { $sum: 1 },
                  averageRating: { $avg: '$rating' },
                  pendingReviews: {
                    $sum: {
                      $cond: [{ $eq: ['$isApproved', false] }, 1, 0]
                    }
                  }
                }
              }
            ],
            dateAnalytics: [
              {
                $match: {
                  createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
                }
              },
              {
                $group: {
                  _id: {
                    period: {
                      $cond: [
                        { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                        'last30',
                        'previous30'
                      ]
                    }
                  },
                  count: { $sum: 1 },
                  reviews: { $push: '$$ROOT' }
                }
              }
            ]
          }
        }
      ]).toArray()
        return result
      })(),

      // Consolidated Revenue Query
      (async () => {
        const result = await ordersCollection.aggregate([
        {
          $match: {
            $or: [{ paymentStatus: 'PAID' }, { paymentStatus: 'CASH_ON_DELIVERY' }]
          }
        },
        {
          $addFields: {
            customerType: {
              $cond: [
                {
                  $expr: {
                    $in: ["WELCOME_50", { $ifNull: ["$offers.offerId", []] }]
                  }
                },
                "new",
                "repeat"
              ]
            },
            amountRange: {
              $multiply: [
                { $floor: { $divide: ["$amount", 250] } },
                250
              ]
            },
            dateStr: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata"
              }
            }
          }
        },
        {
          $facet: {
            // Daily revenue with customer breakdown
            dailyRevenue: [
              {
                $group: {
                  _id: "$dateStr",
                  totalRevenue: { $sum: "$amount" },
                  newRevenue: {
                    $sum: {
                      $cond: [{ $eq: ["$customerType", "new"] }, "$amount", 0]
                    }
                  },
                  repeatRevenue: {
                    $sum: {
                      $cond: [{ $eq: ["$customerType", "repeat"] }, "$amount", 0]
                    }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } },
              {
                $setWindowFields: {
                  sortBy: { _id: 1 },
                  output: {
                    totalMovingAvg: {
                      $avg: "$totalRevenue",
                      window: { documents: [-29, 0] }
                    },
                    newMovingAvg: {
                      $avg: "$newRevenue",
                      window: { documents: [-29, 0] }
                    },
                    repeatMovingAvg: {
                      $avg: "$repeatRevenue",
                      window: { documents: [-29, 0] }
                    },
                    countMovingAvg: {
                      $avg: "$count",
                      window: { documents: [-29, 0] }
                    }
                  }
                }
              }
            ],
            // Order amount ranges
            amountRanges: [
              {
                $group: {
                  _id: "$amountRange",
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]).toArray()
        return result
      })()
    ])

    // Extract data from consolidated results
    const orderStats = ordersAnalytics[0]
    const userStats = usersAnalytics[0] 
    const reviewStats = reviewsAnalytics[0]
    const consolidatedRevenue = consolidatedRevenueData[0]

    // Orders data extraction
    const totalStats = orderStats.totalStats[0] || {}
    const totalRevenue = totalStats.totalRevenue || 0
    const totalOrders = totalStats.totalOrders || 0
    const ordersToShip = totalStats.ordersToShip || 0
    
    const orderStatusCounts = orderStats.statusCounts || []
    const customerOrderCounts = orderStats.customerDistribution || []
    
    // Process date analytics for orders
    const orderDateAnalytics = orderStats.dateAnalytics || []
    const last30DaysData = orderDateAnalytics.find((d: any) => d._id.period === 'last30') || { count: 0, revenue: 0, orders: [] }
    const previous30DaysData = orderDateAnalytics.find((d: any) => d._id.period === 'previous30') || { count: 0, revenue: 0, orders: [] }
    
    const last30DaysOrders = last30DaysData.orders
    const previous30DaysOrders = previous30DaysData.orders
    
    // Users data extraction
    const totalUsers = (userStats.totalUsers[0]?.count) || 0
    const userDateAnalytics = userStats.dateAnalytics || []
    const last30DaysUsers = userDateAnalytics.find((d: any) => d._id.period === 'last30')?.users || []
    const previous30DaysUsers = userDateAnalytics.find((d: any) => d._id.period === 'previous30')?.users || []
    
    // Reviews data extraction
    const reviewTotalStats = reviewStats.totalStats[0] || {}
    const totalReviews = reviewTotalStats.totalReviews || 0
    const averageRating = reviewTotalStats.averageRating || 0
    const pendingReviews = reviewTotalStats.pendingReviews || 0
    
    const reviewDateAnalytics = reviewStats.dateAnalytics || []
    const last30DaysReviews = reviewDateAnalytics.find((d: any) => d._id.period === 'last30')?.reviews || []
    const previous30DaysReviews = reviewDateAnalytics.find((d: any) => d._id.period === 'previous30')?.reviews || []

    // Calculate MRR (last 30 days revenue) - now from aggregated data
    const mrr = last30DaysData.revenue
    const previousMrr = previous30DaysData.revenue

    // Calculate growth rates
    const revenueGrowth = previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0
    const ordersGrowth = previous30DaysData.count > 0 ? ((last30DaysData.count - previous30DaysData.count) / previous30DaysData.count) * 100 : 0
    const usersGrowth = previous30DaysUsers.length > 0 ? ((last30DaysUsers.length - previous30DaysUsers.length) / previous30DaysUsers.length) * 100 : 0
    const reviewsGrowth = previous30DaysReviews.length > 0 ? ((last30DaysReviews.length - previous30DaysReviews.length) / previous30DaysReviews.length) * 100 : 0

    // Process order status counts
    const statusMap = orderStatusCounts.reduce((acc: Record<string, number>, status: any) => {
      acc[status._id] = status.count
      return acc
    }, {})

    // Customer order distribution data
    const customerOrderDistributionData = customerOrderCounts.map((item: any) => ({
      name: `${item._id} order${item._id === 1 ? '' : 's'}`,
      value: item.customerCount
    }))

    // Order amount range data from consolidated query
    const orderAmountRangeData = (consolidatedRevenue?.amountRanges || []).map((item: any) => ({
      name: `₹${item._id.toLocaleString()}-₹${(item._id + 249).toLocaleString()}`,
      value: item.count
    }))

    // Process consolidated revenue data with all metrics in single pass
    const dailyRevenueChart: any[] = []
    const dailyRevenueData = consolidatedRevenue?.dailyRevenue || []
    
    // Process each date with all computed moving averages
    dailyRevenueData.forEach((item: any) => {
      const dateStr = item._id
      const movingAverage = item.totalMovingAvg || item.totalRevenue
      const newMovingAverage = item.newMovingAvg || item.newRevenue
      const repeatMovingAverage = item.repeatMovingAvg || item.repeatRevenue
      
      // Format date for display
      const displayDate = new Date(dateStr)
      const name = displayDate.toLocaleDateString('en-IN', { 
        day: '2-digit',
        month: 'short',
        year: dailyRevenueData.length > 365 ? '2-digit' : undefined
      })
      
      dailyRevenueChart.push({
        date: dateStr,
        name: name,
        mrr: movingAverage,
        newCustomerMrr: newMovingAverage,
        repeatCustomerMrr: repeatMovingAverage
      })
    })
    
    // Sort the chart data by date
    dailyRevenueChart.sort((a, b) => a.date.localeCompare(b.date))

    const dashboardData = {
      // Revenue data (all-time total with growth based on last 30 days)
      totalRevenue,
      revenueGrowth,
      
      // Orders data (all-time total with growth based on last 30 days)
      totalOrders,
      ordersGrowth,
      confirmedOrders: totalOrders, // Same as totalOrders since we only count confirmed orders
      pendingOrders: statusMap.PENDING || 0,
      
      // Users data (all-time total with growth based on last 30 days)
      totalUsers,
      usersGrowth,
      
      // Reviews data (all-time total with growth based on last 30 days)
      totalReviews,
      reviewsGrowth,
      averageRating,
      pendingReviews,
      
      // Additional data
      customerOrderDistributionData,
      orderAmountRangeData,
      avgOrderValue: last30DaysData.count > 0 ? mrr / last30DaysData.count : 0,
      
      // Quick Actions data
      ordersToShip,
      
      // Chart data
      dailyRevenueChart
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`❌ Dashboard API error after ${errorTime}ms:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}