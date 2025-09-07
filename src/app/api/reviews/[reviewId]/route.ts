import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const body = await request.json()
    const { sortOrder, isApproved, photos } = body

    // Build update object based on provided fields
    const updateFields: any = {
      updatedAt: new Date()
    }

    // Validate and add sortOrder if provided
    if (sortOrder !== undefined) {
      if (typeof sortOrder !== 'number' || isNaN(sortOrder)) {
        return NextResponse.json(
          { error: 'Invalid sort order. Must be a number.' },
          { status: 400 }
        )
      }
      updateFields.sortOrder = sortOrder
    }

    // Validate and add isApproved if provided
    if (isApproved !== undefined) {
      if (typeof isApproved !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid approval status. Must be a boolean.' },
          { status: 400 }
        )
      }
      updateFields.isApproved = isApproved
    }

    // Validate and add photos if provided
    if (photos !== undefined) {
      if (!Array.isArray(photos)) {
        return NextResponse.json(
          { error: 'Invalid photos. Must be an array.' },
          { status: 400 }
        )
      }
      
      // Validate each photo is a string URL
      for (let i = 0; i < photos.length; i++) {
        if (typeof photos[i] !== 'string') {
          return NextResponse.json(
            { error: `Invalid photo at index ${i}. Must be a string URL.` },
            { status: 400 }
          )
        }
      }
      
      updateFields.photos = photos
    }

    // Ensure at least one field is being updated
    if (Object.keys(updateFields).length === 1) { // Only updatedAt
      return NextResponse.json(
        { error: 'No valid fields provided for update.' },
        { status: 400 }
      )
    }

    const reviewsCollection = await getCollection('reviews')
    
    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(reviewId) },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Review updated successfully'
    })
  } catch (error) {
    console.error('Update review error:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}