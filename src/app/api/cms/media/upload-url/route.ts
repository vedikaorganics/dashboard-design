import { NextRequest, NextResponse } from 'next/server'
import Mux from '@mux/mux-node'
import { getMuxTokenId, getMuxTokenSecret } from '@/lib/env'

// Initialize Mux client
const mux = new Mux({
  tokenId: getMuxTokenId(),
  tokenSecret: getMuxTokenSecret(),
})

// POST /api/cms/media/upload-url - Create a direct upload URL for video files
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filename, folderPath, folderId, alt, caption, tags, fileSize } = body
    

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Create a direct upload with Mux
    const upload = await mux.video.uploads.create({
      cors_origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      new_asset_settings: {
        playback_policy: ['public'],
        // Store metadata that we'll need later
        passthrough: JSON.stringify({
          filename,
          folderPath: folderPath || null,
          folderId: folderId || null, // Keep for backward compatibility
          alt: alt || '',
          caption: caption || '',
          tags: tags || [],
          originalFileSize: fileSize || 0
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: upload.url,
        uploadId: upload.id,
        assetId: upload.asset_id
      }
    })

  } catch (error) {
    console.error('Failed to create upload URL:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create upload URL' },
      { status: 500 }
    )
  }
}