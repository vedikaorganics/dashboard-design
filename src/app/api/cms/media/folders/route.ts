import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MediaFolder } from '@/types/cms'

// POST /api/cms/media/folders - Create new folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, parentId } = body
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Folder name is required' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_folders')
    
    // Check if folder with same name exists in same parent
    const existing = await collection.findOne({ 
      name, 
      parentId: parentId || null 
    })
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Folder with this name already exists in the same location' },
        { status: 409 }
      )
    }
    
    // Build folder path
    let path = `/${name}`
    if (parentId) {
      const parentFolder = await collection.findOne({ _id: new ObjectId(parentId) })
      if (parentFolder) {
        // Ensure parent path starts with / and build nested path
        const parentPath = parentFolder.path.startsWith('/') ? parentFolder.path : `/${parentFolder.path}`
        path = `${parentPath}/${name}`
      }
    }
    
    const now = new Date()
    const folder: Omit<MediaFolder, '_id'> = {
      name,
      parentId: parentId || undefined,
      path,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await collection.insertOne(folder)
    const createdFolder = await collection.findOne({ _id: result.insertedId })
    
    return NextResponse.json({
      success: true,
      data: createdFolder
    })
  } catch (error) {
    console.error('Failed to create folder:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}