import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { revalidateVariant } from '@/lib/revalidate'

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

    // Revalidate website pages after successful variant update
    const revalidateResult = await revalidateVariant(productId, variantId)
    if (!revalidateResult.success) {
      console.warn('Failed to revalidate website pages:', revalidateResult.error)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Variant updated successfully',
      revalidated: revalidateResult.success
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

    // Revalidate website pages after successful variant deletion
    const revalidateResult = await revalidateVariant(productId, variantId)
    if (!revalidateResult.success) {
      console.warn('Failed to revalidate website pages:', revalidateResult.error)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Variant deleted successfully',
      revalidated: revalidateResult.success
    })
  } catch (error) {
    console.error('Variant delete API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    )
  }
}