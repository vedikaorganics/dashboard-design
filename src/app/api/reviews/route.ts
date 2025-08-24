import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const approved = searchParams.get('approved')

    // Check cache first
    const cacheKey = cacheKeys.reviews(page, limit, approved === 'true' ? true : approved === 'false' ? false : undefined)
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const [reviewsCollection, productsCollection] = await Promise.all([
      getCollection('reviews'),
      getCollection('products')
    ])

    // Build filter
    const filter: any = {}
    if (approved !== null && approved !== undefined && approved !== 'all') {
      filter.isApproved = approved === 'true'
    }

    // Execute queries in parallel
    const [reviews, totalCount] = await Promise.all([
      reviewsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      reviewsCollection.countDocuments(filter)
    ])

    // Get product data for reviews (batch fetch)
    const productIds = [...new Set(reviews.map(review => review.productId))]
    const products = await productsCollection
      .find({ id: { $in: productIds } })
      .toArray()
    
    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product
      return acc
    }, {} as Record<string, any>)

    // Enrich reviews with product data
    const enrichedReviews = reviews.map(review => ({
      ...review,
      product: productMap[review.productId]
    }))

    const result = {
      reviews: enrichedReviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    }

    // Cache for 3 minutes
    cache.set(cacheKey, result, 180)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Reviews API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// Update review approval status
export async function PATCH(request: NextRequest) {
  try {
    const { reviewId, isApproved } = await request.json()
    
    const reviewsCollection = await getCollection('reviews')
    
    const result = await reviewsCollection.updateOne(
      { _id: reviewId },
      { 
        $set: { 
          isApproved,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Clear related caches
    cache.delete(cacheKeys.reviews(1, 50, true))
    cache.delete(cacheKeys.reviews(1, 50, false))
    cache.delete(cacheKeys.dashboard)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review update error:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}