import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const includeOrders = searchParams.get('includeOrders') === 'true'
    const includeReviews = searchParams.get('includeReviews') === 'true'
    const includeRewards = searchParams.get('includeRewards') === 'true'


    const usersCollection = await getCollection('users')
    const ordersCollection = await getCollection('orders')
    const reviewsCollection = await getCollection('reviews')
    const rewardsCollection = await getCollection('rewards')

    // Get user details
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Initialize result with user data
    let result: any = {
      ...user,
      totalSpent: 0,
      averageOrderValue: 0,
      customerRank: 'Regular',
      rewardsPoints: 0
    }

    // Get orders if requested
    if (includeOrders) {
      const orders = await ordersCollection
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray()
      
      result.orders = orders
      
      // Calculate spending analytics
      const totalSpent = orders
        .filter(order => order.paymentStatus === 'PAID' || order.paymentStatus === 'CASH_ON_DELIVERY')
        .reduce((sum, order) => sum + (order.amount || 0), 0)
      
      result.totalSpent = totalSpent
      result.averageOrderValue = orders.length > 0 ? Math.round(totalSpent / orders.length) : 0
      
      // Determine customer rank based on spending
      if (totalSpent > 50000) {
        result.customerRank = 'VIP'
      } else if (totalSpent > 20000) {
        result.customerRank = 'Premium'
      }
    }

    // Get reviews if requested
    if (includeReviews) {
      const reviews = await reviewsCollection
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray()
      
      result.reviews = reviews
    }

    // Get rewards if requested
    if (includeRewards) {
      const rewards = await rewardsCollection
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray()
      
      result.rewards = rewards
      
      // Calculate available rewards points
      const totalEarned = rewards
        .filter(reward => !reward.isClaimed)
        .reduce((sum, reward) => sum + (reward.rewardValue || 0), 0)
      
      result.rewardsPoints = totalEarned
    }


    return NextResponse.json(result)
  } catch (error) {
    console.error('Get user details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const { notes } = await request.json()

    const usersCollection = await getCollection('users')
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          notes,
          updatedAt: new Date()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update user note error:', error)
    return NextResponse.json(
      { error: 'Failed to update user note' },
      { status: 500 }
    )
  }
}