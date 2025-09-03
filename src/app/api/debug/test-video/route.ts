import { NextRequest, NextResponse } from 'next/server'
import { getVideoThumbnail, getVideoThumbnailWithSize } from '@/lib/cloudflare'

// GET /api/debug/test-video?videoId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    
    if (!videoId) {
      return NextResponse.json({
        error: 'videoId parameter is required'
      }, { status: 400 })
    }
    
    // Test different thumbnail variations
    const thumbnailVariations = [
      {
        name: 'Default thumbnail',
        url: getVideoThumbnail(videoId, 0)
      },
      {
        name: 'Thumbnail at 1s',
        url: getVideoThumbnail(videoId, 1)
      },
      {
        name: 'Thumbnail at 5s',
        url: getVideoThumbnail(videoId, 5)
      },
      {
        name: 'Small thumbnail (160x120)',
        url: getVideoThumbnailWithSize(videoId, 160, 120, 1)
      },
      {
        name: 'Medium thumbnail (320x240)',
        url: getVideoThumbnailWithSize(videoId, 320, 240, 1)
      }
    ]
    
    // Test accessibility of each variation
    const results = await Promise.all(
      thumbnailVariations.map(async (variation) => {
        try {
          const response = await fetch(variation.url, { method: 'HEAD' })
          return {
            ...variation,
            accessible: response.ok,
            status: response.status
          }
        } catch (error) {
          return {
            ...variation,
            accessible: false,
            status: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )
    
    return NextResponse.json({
      videoId,
      results,
      info: {
        note: 'Video thumbnails may take a few minutes to generate after upload',
        recommendation: 'Use the variation that returns status 200'
      }
    })
  } catch (error) {
    console.error('Video debug test failed:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}