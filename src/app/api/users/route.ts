import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Check cache first
    const cacheKey = cacheKeys.users(page, limit)
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const [usersCollection, ordersCollection, reviewsCollection, rewardsCollection] = await Promise.all([
      getCollection('users'),
      getCollection('orders'),
      getCollection('reviews'),
      getCollection('rewards')
    ])

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      usersCollection
        .find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments()
    ])

    // Get user IDs for batch queries
    const userIds = users.map(user => user._id)

    // Batch fetch related data
    const [orders, reviews, rewards] = await Promise.all([
      ordersCollection.find({ userId: { $in: userIds } }).toArray(),
      reviewsCollection.find({ userId: { $in: userIds } }).toArray(),
      rewardsCollection.find({ userId: { $in: userIds } }).toArray()
    ])

    // Group data by user
    const ordersByUser = orders.reduce((acc, order) => {
      const userId = order.userId.toString()
      if (!acc[userId]) acc[userId] = []
      acc[userId].push(order)
      return acc
    }, {} as Record<string, any[]>)

    const reviewsByUser = reviews.reduce((acc, review) => {
      const userId = review.userId.toString()
      if (!acc[userId]) acc[userId] = []
      acc[userId].push(review)
      return acc
    }, {} as Record<string, any[]>)

    const rewardsByUser = rewards.reduce((acc, reward) => {
      const userId = reward.userId.toString()
      if (!acc[userId]) acc[userId] = []
      acc[userId].push(reward)
      return acc
    }, {} as Record<string, any[]>)

    // Enrich users with analytics
    const enrichedUsers = users.map(user => {
      const userOrders = ordersByUser[user._id.toString()] || []
      const userReviews = reviewsByUser[user._id.toString()] || []
      const userRewards = rewardsByUser[user._id.toString()] || []
      
      const totalSpent = userOrders.reduce((sum, order) => sum + order.amount, 0)
      const unclaimedRewards = userRewards.filter(r => !r.isClaimed).reduce((sum, r) => sum + r.rewardValue, 0)
      
      // Customer classification
      let customerType = 'New'
      if (userOrders.length >= 5) customerType = 'VIP'
      else if (userOrders.length >= 2) customerType = 'Regular'

      return {
        ...user,
        orderCount: userOrders.length,
        reviewCount: userReviews.length,
        totalSpent,
        unclaimedRewards,
        customerType,
        lastOrder: userOrders.length > 0 
          ? userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null
      }
    })

    const result = {
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    }

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}