import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Validate session for security - only admins can view staff
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Check cache first
    const cacheKey = cacheKeys.staff + `_${page}_${limit}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const staffCollection = await getCollection('staffs')

    // Execute queries in parallel
    const [staff, totalCount] = await Promise.all([
      staffCollection
        .find({})
        .sort({ lastLogin: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      staffCollection.countDocuments()
    ])

    // Get full dataset for summary statistics
    const allStaff = await staffCollection.find({}).toArray()

    const result = {
      staff,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      totalStaff: totalCount,
      activeStaff: allStaff.filter(s => s.isActive).length,
      adminCount: allStaff.filter(s => s.role === 'admin').length
    }

    // Cache for 15 minutes (staff data changes rarely)
    cache.set(cacheKey, result, 900)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Staff API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff data' },
      { status: 500 }
    )
  }
}