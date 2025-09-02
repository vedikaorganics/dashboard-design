import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MediaAsset, MediaFolder, MediaAssetListResponse, UploadMediaRequest } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'
import { uploadImageToCloudflare, uploadVideoToCloudflare, getImageVariant, getVideoThumbnail } from '@/lib/cloudflare'
import { resolvePathToFolderId, normalizeFolderPath } from '@/lib/media-path-utils'

// GET /api/cms/media - List media assets and folders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const folderId = searchParams.get('folderId')
    const folderPath = searchParams.get('path')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')
    
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    const foldersCollection = db.collection('cms_media_folders')
    
    // Resolve folder identifier (path or ID)
    let targetFolderId: string | null = null
    
    if (folderPath) {
      // Path-based query - need to resolve path to folder ID
      // First, get all folders to resolve the path
      const allFolders = await foldersCollection.find({}).toArray() as unknown as MediaFolder[]
      targetFolderId = resolvePathToFolderId(folderPath, allFolders)
    } else if (folderId) {
      // Legacy folder ID query
      targetFolderId = folderId === 'root' ? null : folderId
    }
    // If neither is provided, targetFolderId remains null (root folder)
    
    // Build assets query
    const assetsQuery: any = {}
    if (folderPath !== undefined || folderId !== undefined) {
      assetsQuery.folderId = targetFolderId
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
    if (folderPath !== undefined || folderId !== undefined) {
      foldersQuery.parentId = targetFolderId
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

// POST /api/cms/media - Upload media asset to Cloudflare
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string
    const caption = formData.get('caption') as string
    const tags = formData.get('tags') as string
    const folderId = formData.get('folderId') as string
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection('cms_media_assets')
    
    const now = new Date()
    const userId = await getCurrentUserId(request)
    
    let cloudflareResult
    let url: string
    let thumbnailUrl: string
    let cloudflareId: string
    let type: 'image' | 'video'
    
    // Determine file type and upload to appropriate Cloudflare service
    if (file.type.startsWith('image/')) {
      type = 'image'
      cloudflareResult = await uploadImageToCloudflare(file, {
        alt: alt || '',
        caption: caption || ''
      })
      url = cloudflareResult.url
      thumbnailUrl = getImageVariant(cloudflareResult.id, 'thumbnail')
      cloudflareId = cloudflareResult.id
    } else if (file.type.startsWith('video/')) {
      type = 'video'
      cloudflareResult = await uploadVideoToCloudflare(file, {
        name: file.name,
        requireSignedURLs: false // Set to true if you want signed URLs
      })
      url = `https://videodelivery.net/${cloudflareResult.uid}`
      
      // Use proper thumbnail URL with time parameter for better generation
      thumbnailUrl = getVideoThumbnail(cloudflareResult.uid, 1)
      cloudflareId = cloudflareResult.uid
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Only images and videos are allowed.' },
        { status: 400 }
      )
    }
    
    const asset: Omit<MediaAsset, '_id'> = {
      url,
      thumbnailUrl,
      type,
      filename: file.name,
      size: file.size,
      dimensions: undefined, // Dimensions will be fetched dynamically from Cloudflare
      alt: alt || '',
      caption: caption || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      folderId: folderId || undefined,
      metadata: {
        mimeType: file.type,
        uploadedBy: userId,
        originalName: file.name,
        cloudflareId, // Store Cloudflare ID for deletion
        ...(type === 'video' && {
          streamUrl: `https://videodelivery.net/${cloudflareId}/manifest/video.m3u8`,
          dashUrl: `https://videodelivery.net/${cloudflareId}/manifest/video.mpd`,
          status: (cloudflareResult as any).status
        }),
        ...(type === 'image' && {
          variants: (cloudflareResult as any).variants
        })
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