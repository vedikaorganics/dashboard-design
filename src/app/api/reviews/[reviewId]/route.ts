import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const { sortOrder } = await request.json()

    // Validate sortOrder
    if (typeof sortOrder !== 'number' || isNaN(sortOrder)) {
      return NextResponse.json(
        { error: 'Invalid sort order. Must be a number.' },
        { status: 400 }
      )
    }

    const reviewsCollection = await getCollection('reviews')
    
    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(reviewId) },
      { 
        $set: { 
          sortOrder,
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


    return NextResponse.json({ 
      success: true,
      message: 'Sort order updated successfully'
    })
  } catch (error) {
    console.error('Update review sort order error:', error)
    return NextResponse.json(
      { error: 'Failed to update sort order' },
      { status: 500 }
    )
  }
}