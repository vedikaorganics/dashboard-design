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
    const lastOrdered = searchParams.get('lastOrdered')?.split(',') || undefined

    // Create cache key that includes all filter parameters
    const filterParams = {
      search,
      phoneVerified: phoneVerified?.sort().join(','),
      lastOrdered: lastOrdered?.sort().join(',')
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

    // Last ordered date filter
    if (lastOrdered && lastOrdered.length > 0) {
      const now = new Date()
      const dateFilters: any[] = []
      
      for (const range of lastOrdered) {
        switch (range) {
          case 'never':
            dateFilters.push({ lastOrderedOn: { $exists: false } })
            dateFilters.push({ lastOrderedOn: null })
            break
          case 'last_7_days':
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            dateFilters.push({ lastOrderedOn: { $gte: last7Days } })
            break
          case 'last_30_days':
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            dateFilters.push({ lastOrderedOn: { $gte: last30Days } })
            break
          case 'last_90_days':
            const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            dateFilters.push({ lastOrderedOn: { $gte: last90Days } })
            break
          case 'over_90_days':
            const over90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            dateFilters.push({ 
              lastOrderedOn: { 
                $exists: true, 
                $ne: null, 
                $lt: over90Days 
              } 
            })
            break
        }
      }
      
      if (dateFilters.length > 0) {
        if (dateFilters.length === 1) {
          // Single date filter, apply directly
          Object.assign(filter, dateFilters[0])
        } else {
          // Multiple date filters, use $or
          const existingOr = filter.$or as any[] || []
          filter.$or = [...existingOr, ...dateFilters]
        }
      }
    }
    
    // Search filter - search across multiple fields
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i')
      
      const searchFilters = [
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
      
      if (filter.$or) {
        // Combine with existing $or filters using $and
        filter.$and = [
          { $or: filter.$or },
          { $or: searchFilters }
        ]
        delete filter.$or
      } else {
        filter.$or = searchFilters
      }
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