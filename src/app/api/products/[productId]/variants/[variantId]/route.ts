import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string, variantId: string }> }
) {
  try {
    const { productId, variantId } = await context.params
    const updateData = await request.json()

    const variantsCollection = await getCollection('productvariants')

    // Update the variant
    const result = await variantsCollection.updateOne(
      { id: variantId, productId },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date() 
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Clear caches
    const productCacheKey = `${cacheKeys.products}:${productId}`
    cache.delete(productCacheKey)
    cache.delete(cacheKeys.products)

    return NextResponse.json({ 
      success: true,
      message: 'Variant updated successfully' 
    })
  } catch (error) {
    console.error('Variant update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string, variantId: string }> }
) {
  try {
    const { productId, variantId } = await context.params

    const variantsCollection = await getCollection('productvariants')

    // Delete the variant
    const result = await variantsCollection.deleteOne({
      id: variantId,
      productId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    // Clear caches
    const productCacheKey = `${cacheKeys.products}:${productId}`
    cache.delete(productCacheKey)
    cache.delete(cacheKeys.products)

    return NextResponse.json({ 
      success: true,
      message: 'Variant deleted successfully' 
    })
  } catch (error) {
    console.error('Variant delete API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}