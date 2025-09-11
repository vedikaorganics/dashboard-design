import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { revalidateProduct } from '@/lib/revalidate'

export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params
    

    const [productsCollection, variantsCollection, reviewsCollection] = await Promise.all([
      getCollection('products'),
      getCollection('productvariants'),
      getCollection('reviews')
    ])

    // Execute queries in parallel
    const [product, variants, reviews] = await Promise.all([
      productsCollection.findOne({ id: productId }),
      variantsCollection.find({ productId }).sort({ variantOrder: 1 }).toArray(),
      reviewsCollection.find({ productId }).toArray()
    ])

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Calculate aggregated data
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

    const minPrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0
    const maxPrice = variants.length > 0 ? Math.max(...variants.map(v => v.price)) : 0

    // Group reviews by approval status
    const approvedReviews = reviews.filter(review => review.isApproved)
    const pendingReviews = reviews.filter(review => !review.isApproved)

    const result = {
      ...product,
      variants,
      reviews,
      approvedReviews,
      pendingReviews,
      reviewCount: reviews.length,
      avgRating: parseFloat(avgRating.toFixed(1)),
      minPrice,
      maxPrice,
      totalVariants: variants.length,
      // Add performance metrics
      variantsByType: variants.reduce((acc, variant) => {
        acc[variant.type] = (acc[variant.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }


    return NextResponse.json(result)
  } catch (error) {
    console.error('Product detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params
    const updateData = await request.json()

    const productsCollection = await getCollection('products')

    // Update the product
    const result = await productsCollection.updateOne(
      { id: productId },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date() 
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Revalidate website pages after successful update
    const revalidateResult = await revalidateProduct(productId, updateData.slug)
    if (!revalidateResult.success) {
      console.warn('Failed to revalidate website pages:', revalidateResult.error)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Product updated successfully',
      revalidated: revalidateResult.success
    })
  } catch (error) {
    console.error('Product update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await context.params

    const [productsCollection, variantsCollection] = await Promise.all([
      getCollection('products'),
      getCollection('productvariants')
    ])

    // Delete product and all its variants
    const [productResult, variantResult] = await Promise.all([
      productsCollection.deleteOne({ id: productId }),
      variantsCollection.deleteMany({ productId })
    ])

    if (productResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Revalidate website pages after successful deletion
    const revalidateResult = await revalidateProduct(productId)
    if (!revalidateResult.success) {
      console.warn('Failed to revalidate website pages:', revalidateResult.error)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Product and variants deleted successfully',
      deletedVariants: variantResult.deletedCount,
      revalidated: revalidateResult.success
    })
  } catch (error) {
    console.error('Product delete API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}