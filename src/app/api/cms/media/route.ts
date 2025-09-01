import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MediaAsset, MediaFolder, MediaAssetListResponse, UploadMediaRequest } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'

// GET /api/cms/media - List media assets and folders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const folderId = searchParams.get('folderId')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')
    
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    const foldersCollection = db.collection('cms_media_folders')
    
    // Build assets query
    const assetsQuery: any = {}
    if (folderId) {
      assetsQuery.folderId = folderId === 'root' ? null : folderId
    }
    if (type) assetsQuery.type = type
    if (search) {
      assetsQuery.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { alt: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } }
      ]
    }
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim())
      assetsQuery.tags = { $in: tagArray }
    }
    
    // Build folders query
    const foldersQuery: any = {}
    if (folderId) {
      foldersQuery.parentId = folderId === 'root' ? null : folderId
    }
    
    // Execute queries in parallel
    const [assets, totalAssets, folders] = await Promise.all([
      assetsCollection
        .find(assetsQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      assetsCollection.countDocuments(assetsQuery),
      foldersCollection
        .find(foldersQuery)
        .sort({ name: 1 })
        .toArray()
    ])
    
    const response: MediaAssetListResponse = {
      success: true,
      data: {
        assets: assets as unknown as MediaAsset[],
        folders: folders as unknown as MediaFolder[],
        pagination: {
          total: totalAssets,
          page,
          limit,
          pages: Math.ceil(totalAssets / limit)
        }
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch media assets:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media assets' },
      { status: 500 }
    )
  }
}

// POST /api/cms/media - Upload media asset (placeholder for multipart form handling)
export async function POST(request: NextRequest) {
  try {
    // NOTE: This is a simplified version. In a real implementation, you'd handle
    // multipart form data with libraries like formidable or multer
    // For now, we'll expect a JSON body with the file URL already processed
    
    const body = await request.json()
    const { url, filename, type, size, dimensions, alt, caption, tags, folderId } = body
    
    if (!url || !filename || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: url, filename, type' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_assets')
    
    const now = new Date()
    
    // Generate thumbnail URL based on type
    let thumbnailUrl = url
    if (type === 'image') {
      // In a real implementation, you'd generate actual thumbnails
      thumbnailUrl = url // For now, use the same URL
    }
    
    const asset: Omit<MediaAsset, '_id'> = {
      url,
      thumbnailUrl,
      type: type as MediaAsset['type'],
      filename,
      size: size || 0,
      dimensions: dimensions || undefined,
      alt: alt || '',
      caption: caption || '',
      tags: tags || [],
      folderId: folderId || undefined,
      metadata: {
        mimeType: `${type}/*`, // Simplified mime type
        uploadedBy: await getCurrentUserId(request),
        originalName: filename
      },
      createdAt: now,
      updatedAt: now
    }
    
    const result = await collection.insertOne(asset)
    const createdAsset = await collection.findOne({ _id: result.insertedId })
    
    return NextResponse.json({
      success: true,
      data: createdAsset
    })
  } catch (error) {
    console.error('Failed to upload media asset:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload media asset' },
      { status: 500 }
    )
  }
}