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
    

    const reviewsCollection = await getCollection('reviews')

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

    // Execute single aggregation with product lookup
    const [reviewsResult] = await Promise.all([
      reviewsCollection.aggregate([
        {
          $facet: {
            // Main reviews data with product lookup
            reviews: [
              { $match: filter },
              { $sort: { createdAt: -1 } },
              { $skip: (page - 1) * limit },
              { $limit: limit },
              {
                $lookup: {
                  from: 'products',
                  localField: 'productId',
                  foreignField: 'id',
                  as: 'product'
                }
              },
              {
                $addFields: {
                  product: { $arrayElemAt: ['$product', 0] }
                }
              }
            ],
            // Total count for pagination
            totalCount: [
              { $match: filter },
              { $count: 'count' }
            ]
          }
        }
      ]).toArray()
    ])

    // Extract results from aggregation
    const aggregationResult = reviewsResult[0]
    let enrichedReviews = aggregationResult.reviews || []
    const totalCount = aggregationResult.totalCount[0]?.count || 0

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

    
    return NextResponse.json(result)
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`❌ Reviews API error after ${errorTime}ms:`, error)
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


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review update error:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}