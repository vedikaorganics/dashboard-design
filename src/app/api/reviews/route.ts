import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache } from '@/lib/cache'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const approved = searchParams.get('approved')
    const search = searchParams.get('search') || undefined
    const rating = searchParams.get('rating')?.split(',') || undefined

    // Create cache key that includes all filter parameters
    const filterParams = {
      approved: approved || 'all',
      search,
      rating: rating?.sort().join(',')
    }
    const cacheKey = `reviews-${page}-${limit}-${JSON.stringify(filterParams)}`
    
    // Check cache first
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
    
    // Approval status filter (existing)
    if (approved !== null && approved !== undefined && approved !== 'all') {
      filter.isApproved = approved === 'true'
    }
    
    // Rating filter
    if (rating && rating.length > 0) {
      const ratingNumbers = rating.map(r => parseInt(r)).filter(r => !isNaN(r))
      if (ratingNumbers.length > 0) {
        filter.rating = { $in: ratingNumbers }
      }
    }
    
    // Search filter - search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      
      filter.$or = [
        // Search in author name
        { author: searchRegex },
        
        // Search in review text
        { text: searchRegex },
        
        // Search in review ID
        { _id: searchRegex }
      ]
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
    let enrichedReviews = reviews.map(review => ({
      ...review,
      product: productMap[review.productId]
    }))

    // Apply post-processing search filter for product names
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      enrichedReviews = enrichedReviews.filter((review: any) => {
        // If already matched by MongoDB query, keep it
        const authorMatch = review.author?.toLowerCase?.().includes(search.trim().toLowerCase())
        const textMatch = review.text?.toLowerCase?.().includes(search.trim().toLowerCase())
        const idMatch = review._id?.toString?.().toLowerCase().includes(search.trim().toLowerCase())
        
        if (authorMatch || textMatch || idMatch) {
          return true
        }
        
        // Additional check for product name
        const productTitle = review.product?.title || review.product || ''
        return searchRegex.test(productTitle)
      })
    }

    // Adjust pagination for post-processed filtering
    const finalCount = enrichedReviews.length
    
    const result = {
      reviews: enrichedReviews,
      pagination: {
        page,
        limit,
        total: (search && search.trim()) ? finalCount : totalCount,
        totalPages: (search && search.trim()) ? 1 : Math.ceil(totalCount / limit),
        hasNext: (search && search.trim()) ? false : page < Math.ceil(totalCount / limit),
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

    // Clear related caches - clear all review caches since we now have complex filtering
    const cacheStats = cache.getStats()
    cacheStats.keys.forEach(key => {
      if (key.startsWith('reviews-')) {
        cache.delete(key)
      }
    })
    cache.delete('dashboard-overview')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review update error:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}