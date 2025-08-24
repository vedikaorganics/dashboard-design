import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET() {
  try {
    // Check cache first
    const cached = cache.get(cacheKeys.campaigns)
    if (cached) {
      return NextResponse.json(cached)
    }

    const ordersCollection = await getCollection('orders')

    // Get all orders with UTM parameters
    const orders = await ordersCollection
      .find({ 
        utmParams: { $exists: true, $ne: null }
      })
      .toArray()

    // UTM campaign analysis
    const utmData: Record<string, { orders: number; revenue: number; customers: Set<string> }> = {}
    
    orders.forEach(order => {
      if (order.utmParams) {
        const key = `${order.utmParams.utm_source} - ${order.utmParams.utm_medium}`
        if (!utmData[key]) {
          utmData[key] = { orders: 0, revenue: 0, customers: new Set() }
        }
        utmData[key].orders += 1
        utmData[key].revenue += order.amount
        utmData[key].customers.add(order.userId)
      }
    })

    // Convert to analytics format
    const campaigns = Object.entries(utmData).map(([campaign, data]) => ({
      campaign,
      source: campaign.split(' - ')[0],
      medium: campaign.split(' - ')[1],
      orders: data.orders,
      revenue: data.revenue,
      customers: data.customers.size,
      avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
      customerAcquisitionRate: (data.customers.size / data.orders) * 100,
      revenuePerCustomer: data.customers.size > 0 ? data.revenue / data.customers.size : 0
    })).sort((a, b) => b.revenue - a.revenue)

    // Summary statistics
    const totalRevenue = campaigns.reduce((sum, campaign) => sum + campaign.revenue, 0)
    const totalOrders = campaigns.reduce((sum, campaign) => sum + campaign.orders, 0)
    const totalCustomers = new Set(orders.map(order => order.userId)).size
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Chart data
    const revenueChartData = campaigns.slice(0, 5).map(campaign => ({
      name: campaign.source,
      value: campaign.revenue
    }))

    const ordersChartData = campaigns.slice(0, 7).map(campaign => ({
      name: campaign.source.substring(0, 10),
      value: campaign.orders
    }))

    const result = {
      campaigns,
      summary: {
        totalCampaigns: campaigns.length,
        totalRevenue,
        totalOrders,
        totalCustomers,
        avgOrderValue
      },
      chartData: {
        revenueChart: revenueChartData,
        ordersChart: ordersChartData
      }
    }

    // Cache for 8 minutes
    cache.set(cacheKeys.campaigns, result, 480)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Campaigns API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign data' },
      { status: 500 }
    )
  }
}