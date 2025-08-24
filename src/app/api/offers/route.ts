import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET() {
  try {
    // Check cache first
    const cached = cache.get(cacheKeys.offers)
    if (cached) {
      return NextResponse.json(cached)
    }

    const [offersCollection, ordersCollection] = await Promise.all([
      getCollection('offers'),
      getCollection('orders')
    ])

    // Execute queries in parallel
    const [offers, orders] = await Promise.all([
      offersCollection.find({}).sort({ createdAt: -1 }).toArray(),
      ordersCollection.find({ 'offers.0': { $exists: true } }).toArray()
    ])

    // Calculate offer usage statistics
    const offerUsage = orders.reduce((acc, order) => {
      order.offers?.forEach((offer: any) => {
        const offerId = offer.offerId
        if (!acc[offerId]) {
          acc[offerId] = {
            usageCount: 0,
            totalSavings: 0,
            revenueGenerated: 0
          }
        }
        acc[offerId].usageCount += 1
        acc[offerId].totalSavings += offer.discount || 0
        acc[offerId].revenueGenerated += order.amount
      })
      return acc
    }, {} as Record<string, any>)

    // Enrich offers with usage data
    const enrichedOffers = offers.map(offer => {
      const usage = offerUsage[offer.id] || { usageCount: 0, totalSavings: 0, revenueGenerated: 0 }
      
      return {
        ...offer,
        usageCount: usage.usageCount,
        totalSavings: usage.totalSavings,
        revenueGenerated: usage.revenueGenerated,
        isActive: offer.triggerPrice !== null || !offer.isUserOffer,
        effectivenessScore: usage.usageCount * (usage.revenueGenerated / Math.max(usage.totalSavings, 1))
      }
    })

    const result = {
      offers: enrichedOffers,
      totalOffers: offers.length,
      totalUsage: Object.values(offerUsage).reduce((sum: number, usage: any) => sum + usage.usageCount, 0),
      totalSavings: Object.values(offerUsage).reduce((sum: number, usage: any) => sum + usage.totalSavings, 0)
    }

    // Cache for 10 minutes
    cache.set(cacheKeys.offers, result, 600)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Offers API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    )
  }
}