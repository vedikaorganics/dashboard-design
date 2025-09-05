import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { MediaAsset, MediaAssetListResponse } from '@/types/cms'

// GET /api/cms/media/trash - List soft-deleted media assets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'deletedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    
    // Build query for soft-deleted items only
    const assetsQuery: any = {
      deletedAt: { $exists: true }
    }
    
    if (type) assetsQuery.type = type
    if (search) {
      assetsQuery.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { alt: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Build sort object
    const sortField = sortBy === 'deletedAt' ? 'deletedAt' :
                     sortBy === 'date' ? 'createdAt' : 
                     sortBy === 'name' ? 'filename' :
                     sortBy === 'size' ? 'size' :
                     sortBy === 'type' ? 'type' : 'deletedAt'
    const sortDirection = sortOrder === 'asc' ? 1 : -1
    const sortObject: Record<string, number> = { [sortField]: sortDirection }
    
    // Execute queries in parallel
    const [assets, totalAssets] = await Promise.all([
      assetsCollection
        .find(assetsQuery)
        .sort(sortObject as any)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      assetsCollection.countDocuments(assetsQuery)
    ])
    
    const pagination = {
      total: totalAssets,
      page,
      limit,
      pages: Math.ceil(totalAssets / limit)
    }
    
    const response: MediaAssetListResponse = {
      success: true,
      data: {
        assets: assets as unknown as MediaAsset[],
        folders: [], // No folders in trash view
        pagination
      }
    }
    
    console.log(`Trash API Debug: Found ${totalAssets} deleted assets, returning page ${page} with ${assets.length} items`)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch trash media:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trash media',
        data: { assets: [], folders: [], pagination: null }
      },
      { status: 500 }
    )
  }
}

// DELETE /api/cms/media/trash - Empty trash (permanent delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assetIds = searchParams.get('ids')?.split(',')
    
    if (!assetIds || assetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No asset IDs provided' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    
    // Only allow permanent deletion of soft-deleted items
    const result = await assetsCollection.deleteMany({
      _id: { $in: assetIds.map(id => new ObjectId(id)) },
      deletedAt: { $exists: true }
    })
    
    console.log(`Permanently deleted ${result.deletedCount} assets from trash`)
    
    return NextResponse.json({
      success: true,
      message: `Permanently deleted ${result.deletedCount} assets`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Failed to empty trash:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to empty trash' },
      { status: 500 }
    )
  }
}