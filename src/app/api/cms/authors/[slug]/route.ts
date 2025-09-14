import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { getCurrentUserId, getCurrentUserName } from '@/lib/auth-utils'
import { AUTHORS_COLLECTION, prepareAuthorForSave } from '@/lib/authors/utils'
import type { UpdateAuthorRequest } from '@/types/authors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { db } = await connectToDatabase()
    const { slug } = await params
    
    const author = await db.collection(AUTHORS_COLLECTION)
      .findOne({ slug })
    
    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(author)
  } catch (error) {
    console.error('Error fetching author:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { db } = await connectToDatabase()
    const { slug } = await params
    
    const body: UpdateAuthorRequest = await request.json()
    
    // Get current user info for audit trail
    const updatedBy = await getCurrentUserName(request)
    
    // Prepare update data (excluding slug which cannot be changed)
    const { slug: _, ...updateData } = body
    const authorData = prepareAuthorForSave({
      ...updateData,
      updatedBy
    })
    
    // Remove fields that shouldn't be updated
    delete (authorData as any)._id
    delete (authorData as any).slug
    delete (authorData as any).createdAt
    delete (authorData as any).createdBy
    
    // Update author
    const result = await db.collection(AUTHORS_COLLECTION)
      .findOneAndUpdate(
        { slug },
        { $set: authorData },
        { returnDocument: 'after' }
      )
    
    if (!result) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating author:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update author' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { db } = await connectToDatabase()
    const { slug } = await params
    
    // Get current user info for audit trail
    const updatedBy = await getCurrentUserName(request)
    
    // Soft delete by setting status to archived
    const result = await db.collection(AUTHORS_COLLECTION)
      .findOneAndUpdate(
        { slug },
        { 
          $set: { 
            status: 'archived',
            updatedAt: new Date(),
            updatedBy
          }
        },
        { returnDocument: 'after' }
      )
    
    if (!result) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Author archived successfully' })
  } catch (error) {
    console.error('Error deleting author:', error)
    return NextResponse.json(
      { error: 'Failed to delete author' },
      { status: 500 }
    )
  }
}