import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId parameter is required' },
        { status: 400 }
      )
    }

    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
    const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: `API call failed: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: result.success,
      rawResponse: result,
      parsedData: {
        width: result.result?.width,
        height: result.result?.height,
        format: result.result?.format,
        fileSize: result.result?.fileSize,
        allKeys: result.result ? Object.keys(result.result) : []
      }
    })

  } catch (error) {
    console.error('Debug image metadata error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}