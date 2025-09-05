import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { CMSContent } from '@/types/cms'

interface Params {
  slug: string
  version: string
}

// GET /api/cms/content/[slug]/versions/[version] - Get specific version
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug, version } = await params
    const versionNumber = parseInt(version)
    
    if (isNaN(versionNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid version number' },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    const collection = db.collection('cms_content')
    
    const content = await collection.findOne({ 
      slug, 
      version: versionNumber 
    })
    
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: content as unknown as CMSContent
    })
  } catch (error) {
    console.error('Failed to fetch content version:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version' },
      { status: 500 }
    )
  }
}