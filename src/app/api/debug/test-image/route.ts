import { NextRequest, NextResponse } from 'next/server'
import { testImageUrl, getImageVariant } from '@/lib/cloudflare'

// GET /api/debug/test-image?imageId=xxx&variant=thumbnail
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    const variant = searchParams.get('variant') || 'public'
    
    if (!imageId) {
      return NextResponse.json({
        error: 'imageId parameter is required'
      }, { status: 400 })
    }
    
    // Test different variants
    const variants = ['public', 'thumbnail', 'hero']
    const results = await Promise.all(
      variants.map(async (v) => {
        const result = await testImageUrl(imageId, v)
        return {
          variant: v,
          ...result
        }
      })
    )
    
    return NextResponse.json({
      imageId,
      accountHash: process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH,
      results,
      env: {
        hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
        hasApiToken: !!process.env.CLOUDFLARE_API_TOKEN,
        hasAccountHash: !!process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH
      }
    })
  } catch (error) {
    console.error('Debug test failed:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}