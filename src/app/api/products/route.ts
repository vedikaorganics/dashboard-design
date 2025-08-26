import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Check cache first
    const cached = cache.get(cacheKeys.products)
    if (cached) {
      return NextResponse.json(cached)
    }

    const [productsCollection, variantsCollection, reviewsCollection] = await Promise.all([
      getCollection('products'),
      getCollection('productvariants'),
      getCollection('reviews')
    ])

    // Execute queries in parallel
    const [products, variants, reviews] = await Promise.all([
      productsCollection.find({}).toArray(),
      variantsCollection.find({}).toArray(),
      reviewsCollection.find({}).toArray()
    ])

    // Group variants by product
    const variantsByProduct = variants.reduce((acc, variant) => {
      if (!acc[variant.productId]) {
        acc[variant.productId] = []
      }
      acc[variant.productId].push(variant)
      return acc
    }, {} as Record<string, any[]>)

    // Group reviews by product
    const reviewsByProduct = reviews.reduce((acc, review) => {
      if (!acc[review.productId]) {
        acc[review.productId] = []
      }
      acc[review.productId].push(review)
      return acc
    }, {} as Record<string, any[]>)

    // Enrich products with variants and review data
    const enrichedProducts = products.map(product => {
      const productVariants = variantsByProduct[product.id] || []
      const productReviews = reviewsByProduct[product.id] || []
      
      const avgRating = productReviews.length > 0 
        ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
        : 0

      return {
        ...product,
        variants: productVariants,
        reviewCount: productReviews.length,
        avgRating: parseFloat(avgRating.toFixed(1)),
        minPrice: productVariants.length > 0 ? Math.min(...productVariants.map(v => v.price)) : 0,
        maxPrice: productVariants.length > 0 ? Math.max(...productVariants.map(v => v.price)) : 0
      }
    })

    const result = {
      products: enrichedProducts,
      totalProducts: products.length,
      totalVariants: variants.length,
      avgRating: reviews.length > 0 
        ? parseFloat((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
        : 0
    }

    // Cache for 10 minutes (products don't change often)
    cache.set(cacheKeys.products, result, 600)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}