import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache, cacheKeys } from '@/lib/cache'

export async function GET() {
  try {
    // Check cache first
    const cached = cache.get(cacheKeys.staff)
    if (cached) {
      return NextResponse.json(cached)
    }

    const staffCollection = await getCollection('staffs')

    const staff = await staffCollection
      .find({})
      .sort({ lastLogin: -1 })
      .toArray()

    const result = {
      staff,
      totalStaff: staff.length,
      activeStaff: staff.filter(s => s.isActive).length,
      adminCount: staff.filter(s => s.role === 'admin').length
    }

    // Cache for 15 minutes (staff data changes rarely)
    cache.set(cacheKeys.staff, result, 900)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Staff API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff data' },
      { status: 500 }
    )
  }
}