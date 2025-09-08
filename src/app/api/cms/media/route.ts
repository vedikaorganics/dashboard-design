import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MediaAsset, MediaFolder, MediaAssetListResponse, UploadMediaRequest } from '@/types/cms'
import { getCurrentUserId } from '@/lib/auth-utils'
import { uploadImageToCloudflare, getImageVariant } from '@/lib/cloudflare'
import { resolvePathToFolderId, normalizeFolderPath } from '@/lib/media-path-utils'

// Helper function to extract image dimensions from buffer
async function getImageDimensionsFromFile(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // PNG dimensions
    if (buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      const width = buffer.readUInt32BE(16)
      const height = buffer.readUInt32BE(20)
      return { width, height }
    }
    
    // JPEG dimensions
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2
      while (offset < buffer.length - 4) {
        const marker = buffer.readUInt16BE(offset)
        if ((marker & 0xFF00) !== 0xFF00) break
        
        const length = buffer.readUInt16BE(offset + 2)
        if (marker === 0xFFC0 || marker === 0xFFC2) {
          const height = buffer.readUInt16BE(offset + 5)
          const width = buffer.readUInt16BE(offset + 7)
          return { width, height }
        }
        offset += 2 + length
      }
    }
    
    // GIF dimensions
    if (buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a') {
      const width = buffer.readUInt16LE(6)
      const height = buffer.readUInt16LE(8)
      return { width, height }
    }
    
    // WebP dimensions
    if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
      const format = buffer.subarray(12, 16).toString()
      if (format === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3FFF
        const height = buffer.readUInt16LE(28) & 0x3FFF
        return { width, height }
      } else if (format === 'VP8L') {
        const data = buffer.readUInt32LE(21)
        const width = (data & 0x3FFF) + 1
        const height = ((data >> 14) & 0x3FFF) + 1
        return { width, height }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error extracting image dimensions from file:', error)
    return null
  }
}

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
    const sortBy = searchParams.get('sortBy') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    const foldersCollection = db.collection('cms_media_folders')
    
    // Resolve folder identifier (path or ID)
    let targetFolderId: string | null = null
    
    if (folderPath) {
      // Path-based query - need to resolve path to folder ID
      // First, get all folders to resolve the path
      const allFolders = await foldersCollection.find({}).toArray() as unknown as MediaFolder[]
      const resolvedId = resolvePathToFolderId(folderPath, allFolders)
      // Convert ObjectId to string to match how folderId is stored in assets
      targetFolderId = resolvedId ? resolvedId.toString() : null
      console.log(`⚙️ After resolution: targetFolderId="${targetFolderId}" (type: ${typeof targetFolderId})`)
    } else if (folderId) {
      // Legacy folder ID query
      targetFolderId = folderId === 'root' ? null : folderId
      console.log(`⚙️ Using legacy folderId: targetFolderId="${targetFolderId}" (type: ${typeof targetFolderId})`)
    }
    // If neither is provided, targetFolderId remains null (root folder)
    console.log(`⚙️ Final targetFolderId before query: "${targetFolderId}" (type: ${typeof targetFolderId})`)
    
    // Build assets query
    const assetsQuery: any = {}
    
    // Filter soft-deleted items unless explicitly requested
    if (!includeDeleted) {
      assetsQuery.deletedAt = { $exists: false }
    }
    
    // Only filter by folderId if we have a resolved target folder, otherwise show all assets
    if (targetFolderId !== null) {
      // Keep as string since folderId is stored as string in database
      assetsQuery.folderId = targetFolderId
      console.log(`API Debug: Filtering by string folderId="${targetFolderId}" (folderPath="${folderPath}", folderId="${folderId}")`)
    } else {
      console.log(`API Debug: No folder filtering - showing ALL assets (folderPath="${folderPath}", folderId="${folderId}")`)
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
    
    // Build folders query - always fetch ALL folders to build complete tree
    const foldersQuery: any = {}
    console.log(`API Debug: Fetching ALL folders to build complete folder tree`)
    
    // Add more debugging for the final query
    console.log(`🔍 Final assets query:`, JSON.stringify(assetsQuery, null, 2))
    
    // Build sort object
    const sortField = sortBy === 'date' ? 'createdAt' : 
                     sortBy === 'name' ? 'filename' :
                     sortBy === 'size' ? 'size' :
                     sortBy === 'type' ? 'type' : 'createdAt'
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    const sortObject: Record<string, number> = { [sortField]: sortDirection }
    
    // Execute queries in parallel
    const [assets, totalAssets, folders] = await Promise.all([
      assetsCollection
        .find(assetsQuery)
        .sort(sortObject as any)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      assetsCollection.countDocuments(assetsQuery),
      foldersCollection
        .find(foldersQuery)
        .sort({ name: 1 })
        .toArray()
    ])
    
    // Enhanced debugging for missing assets
    console.log(`📊 Query results: ${assets.length} assets found, ${totalAssets} total matching`)
    
    if (targetFolderId && totalAssets === 0) {
      // If we're querying for a specific folder but got no results, let's debug
      console.log(`🔍 Debug: No assets found for folderId="${targetFolderId}"`)
      
      // Check what assets exist in the collection with their folderIds
      const allAssetsWithFolderIds = await assetsCollection
        .find({}, { projection: { _id: 1, filename: 1, folderId: 1 } })
        .limit(50)
        .toArray()
      
      console.log(`📋 Sample of all assets in collection:`)
      allAssetsWithFolderIds.forEach(asset => {
        console.log(`  - ${asset.filename}: folderId="${asset.folderId}" (type: ${typeof asset.folderId})`)
      })
      
      // Check for exact matches
      const exactMatches = allAssetsWithFolderIds.filter(asset => asset.folderId === targetFolderId)
      console.log(`🎯 Assets with exact folderId match: ${exactMatches.length}`)
      exactMatches.forEach(asset => {
        console.log(`  - MATCH: ${asset.filename}`)
      })
      
      // Deep character analysis for the specific file
      const mwFile = allAssetsWithFolderIds.find(asset => asset.filename?.includes('MW PDP portrait Guarantee'))
      if (mwFile) {
        const stored = mwFile.folderId
        const queried = targetFolderId
        console.log(`🔬 Character analysis for MW PDP file:`)
        console.log(`  Stored:  "${stored}" (length: ${stored?.length})`)
        console.log(`  Queried: "${queried}" (length: ${queried?.length})`)
        console.log(`  Equal: ${stored === queried}`)
        console.log(`  Stored bytes:  ${Array.from(stored || '').map(c => c.charCodeAt(0))}`)
        console.log(`  Queried bytes: ${Array.from(queried || '').map(c => c.charCodeAt(0))}`)
      }
    }
    
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
    const folderPath = formData.get('folderPath') as string
    
    console.log(`API Upload Debug: Received folderId="${folderId}" folderPath="${folderPath}" for file ${file?.name}`)
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    const foldersCollection = db.collection('cms_media_folders')
    
    const now = new Date()
    const userId = await getCurrentUserId(request)
    
    let cloudflareResult
    let url: string
    let thumbnailUrl: string
    let cloudflareId: string
    let type: 'image' | 'video'
    let dimensions: { width: number; height: number } | null = null
    
    // This endpoint now only handles images - videos go through direct upload
    if (file.type.startsWith('image/')) {
      type = 'image'
      
      // Extract dimensions before uploading to Cloudflare
      dimensions = await getImageDimensionsFromFile(file)
      
      cloudflareResult = await uploadImageToCloudflare(file, {
        alt: alt || '',
        caption: caption || ''
      })
      url = getImageVariant(cloudflareResult.id, 'public')
      thumbnailUrl = getImageVariant(cloudflareResult.id, 'thumbnail')
      cloudflareId = cloudflareResult.id
    } else {
      return NextResponse.json(
        { success: false, error: 'This endpoint only supports images. Videos should use the direct upload flow.' },
        { status: 400 }
      )
    }
    
    // Resolve folder identifier - prefer folderId, fallback to folderPath resolution
    let finalFolderId: string | undefined
    
    if (folderId && folderId.trim()) {
      finalFolderId = folderId
      console.log(`API Upload Debug: Using provided folderId="${finalFolderId}"`)
    } else if (folderPath && folderPath.trim()) {
      // Server-side folder resolution using the same logic as client-side
      console.log(`API Upload Debug: Resolving folderPath="${folderPath}" to folderId`)
      const allFolders = await foldersCollection.find({}).toArray() as unknown as MediaFolder[]
      const resolvedFolderId = resolvePathToFolderId(folderPath, allFolders)
      if (resolvedFolderId) {
        finalFolderId = resolvedFolderId
        console.log(`API Upload Debug: Resolved folderPath to folderId="${finalFolderId}"`)
      } else {
        console.warn(`API Upload Debug: Could not resolve folderPath="${folderPath}" to folderId`)
      }
    }
    
    console.log(`API Upload Debug: Final folderId being saved="${finalFolderId}"`)
    
    const asset: Omit<MediaAsset, '_id'> = {
      url,
      thumbnailUrl,
      type,
      filename: file.name,
      size: file.size,
      dimensions: dimensions || undefined, // Dimensions extracted from file buffer during upload
      alt: alt || '',
      caption: caption || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      folderId: finalFolderId,
      metadata: {
        mimeType: file.type,
        uploadedBy: userId,
        originalName: file.name,
        cloudflareId, // Store Cloudflare ID for deletion
        variants: (cloudflareResult as any).variants
      },
      createdAt: now,
      updatedAt: now
    }
    
    const result = await assetsCollection.insertOne(asset)
    const createdAsset = await assetsCollection.findOne({ _id: result.insertedId })
    
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