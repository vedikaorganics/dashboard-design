import { NextRequest, NextResponse } from 'next/server'
import { getVideoMetadata, getImageVariant } from '@/lib/cloudflare'

// Helper function to extract image dimensions from image data
async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
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
    console.error('Error extracting image dimensions:', error)
    return null
  }
}

// GET /api/cms/media/dimensions - Get media dimensions from Cloudflare
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cloudflareId = searchParams.get('cloudflareId')
    const type = searchParams.get('type') // 'image' or 'video'
    
    if (!cloudflareId || !type) {
      return NextResponse.json(
        { success: false, error: 'cloudflareId and type parameters are required' },
        { status: 400 }
      )
    }

    let dimensions: { width: number; height: number } | null = null

    try {
      if (type === 'image') {
        // Get the public variant URL and extract dimensions from the image
        const imageUrl = getImageVariant(cloudflareId, 'public')
        dimensions = await getImageDimensions(imageUrl)
      } else if (type === 'video') {
        const metadata = await getVideoMetadata(cloudflareId)
        if (metadata && metadata.width && metadata.height) {
          dimensions = { width: metadata.width, height: metadata.height }
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'type must be either "image" or "video"' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error fetching metadata from Cloudflare:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch metadata from Cloudflare' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { dimensions }
    })

  } catch (error) {
    console.error('Dimensions API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}