import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined
    const phoneVerified = searchParams.get('phoneVerified')?.split(',') || undefined

    // Create cache key that includes all filter parameters
    const filterParams = {
      search,
      phoneVerified: phoneVerified?.sort().join(',')
    }
    const cacheKey = `users-${page}-${limit}-${JSON.stringify(filterParams)}`
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const usersCollection = await getCollection('users')

    // Build filter for users
    const filter: Record<string, unknown> = {}
    
    // Phone verification filter
    if (phoneVerified && phoneVerified.length > 0) {
      const verifiedBooleans = phoneVerified.map(v => v === 'verified')
      filter.phoneNumberVerified = { $in: verifiedBooleans }
    }
    
    // Search filter - search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      
      filter.$or = [
        // Search in name
        { name: searchRegex },
        
        // Search in phone number
        { phoneNumber: searchRegex },
        
        // Search in email
        { email: searchRegex },
        
        // Search in userId
        { userId: searchRegex },
        
        // Search in notes
        { notes: searchRegex }
      ]
    }

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      usersCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments(filter)
    ])

    // Use the user data as-is, since it already contains the needed fields
    // noOfOrders, lastOrderedOn are already in the user document
    const enrichedUsers = users

    const result = {
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    }

    // Cache for 5 minutes
    cache.set(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}