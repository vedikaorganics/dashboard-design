import { NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 })
    }

    const normalizedQuery = query.trim()
    // Create regex pattern for case-insensitive search
    const searchRegex = new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const searchNumber = parseFloat(normalizedQuery)

    // Helper function to safely search a collection
    const safeCollectionSearch = async (collectionName: string, searchFields: any[]) => {
      try {
        const collection = await getCollection(collectionName)
        return await collection.find({
          $or: searchFields
        }).limit(5).toArray()
      } catch (error) {
        console.warn(`Failed to search ${collectionName}:`, error)
        return []
      }
    }

    // Parallel search across orders, users, and reviews only
    const [users, orders, reviews] = await Promise.all([
      // Search Users - using correct field names from users API
      safeCollectionSearch("users", [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { userId: searchRegex },
        { notes: searchRegex }
      ]),

      // Search Orders - using correct field names from orders API  
      safeCollectionSearch("orders", [
        { orderId: searchRegex },
        { 'address.firstName': searchRegex },
        { 'address.lastName': searchRegex },
        { orderStatus: searchRegex },
        { 'utmParams.utm_source': searchRegex },
        { 'utmParams.utm_medium': searchRegex },
        { 'utmParams.utm_campaign': searchRegex },
        // Include numeric search for amounts if query is numeric
        ...(isNaN(searchNumber) ? [] : [
          { totalAmount: searchNumber },
          { amount: searchNumber }
        ])
      ]),

      // Search Reviews - using correct field names from reviews API
      safeCollectionSearch("reviews", [
        { author: searchRegex },
        { text: searchRegex }
      ])
    ])

    // Transform results and add search context
    const results = {
      query: normalizedQuery,
      totalResults: users.length + orders.length + reviews.length,
      categories: {
        users: users.map(user => ({
          id: user._id,
          type: 'user',
          title: user.name || user.email,
          subtitle: user.email,
          metadata: {
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt,
            userId: user.userId
          }
        })),
        orders: orders.map(order => ({
          id: order._id,
          type: 'order',
          title: order.orderId,
          subtitle: `${order.address?.firstName || ''} ${order.address?.lastName || ''} - $${order.totalAmount?.toFixed(2) || order.amount?.toFixed(2) || '0.00'}`,
          metadata: {
            status: order.orderStatus,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount || order.amount
          }
        })),
        reviews: reviews.map(review => ({
          id: review._id,
          type: 'review',
          title: `Review by ${review.author}`,
          subtitle: review.text?.substring(0, 100) + (review.text?.length > 100 ? '...' : ''),
          metadata: {
            rating: review.rating,
            createdAt: review.createdAt,
            isApproved: review.isApproved
          }
        }))
      }
    }


    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}