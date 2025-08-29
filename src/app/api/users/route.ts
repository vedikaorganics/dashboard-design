import { NextRequest, NextResponse } from 'next/server'
import { db, users } from '@/lib/db'
import { auth } from '@/lib/auth'
import { and, or, like, gte, lt, isNull, isNotNull, count, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'

// Force dynamic rendering to ensure console.logs appear in Vercel production
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  logger.info('Users API: Request started')
  
  try {
    // Validate session for security
    const authStart = Date.now()
    const session = await auth.api.getSession({ headers: request.headers })
    const authTime = Date.now() - authStart
    logger.performance({ operation: 'Auth check', duration: authTime })
    
    if (!session?.user) {
      logger.warn('Users API: Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined
    const phoneVerified = searchParams.get('phoneVerified')?.split(',') || undefined
    const lastOrdered = searchParams.get('lastOrdered')?.split(',') || undefined

    const filterStart = Date.now()
    logger.debug('Building query filters')

    // Build where conditions array
    const whereConditions: any[] = []
    
    // Phone verification filter
    if (phoneVerified && phoneVerified.length > 0) {
      const verifiedBooleans = phoneVerified.map(v => v === 'verified')
      whereConditions.push(
        or(...verifiedBooleans.map(verified => 
          sql`${users.phoneNumberVerified} = ${verified}`
        ))
      )
    }

    // Last ordered date filter
    if (lastOrdered && lastOrdered.length > 0) {
      const now = new Date()
      const dateFilters: any[] = []
      
      for (const range of lastOrdered) {
        switch (range) {
          case 'never':
            dateFilters.push(isNull(users.lastOrderedOn))
            break
          case 'last_7_days':
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            dateFilters.push(gte(users.lastOrderedOn, last7Days))
            break
          case 'last_30_days':
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            dateFilters.push(gte(users.lastOrderedOn, last30Days))
            break
          case 'last_90_days':
            const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            dateFilters.push(gte(users.lastOrderedOn, last90Days))
            break
          case 'over_90_days':
            const over90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            dateFilters.push(
              and(
                isNotNull(users.lastOrderedOn),
                lt(users.lastOrderedOn, over90Days)
              )
            )
            break
        }
      }
      
      if (dateFilters.length > 0) {
        whereConditions.push(or(...dateFilters))
      }
    }
    
    // Search filter - search across multiple fields
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      
      const searchFilters = [
        like(users.name, searchTerm),
        like(users.phoneNumber, searchTerm),
        like(users.email, searchTerm),
        like(users.userId, searchTerm),
        like(users.notes, searchTerm)
      ]
      
      whereConditions.push(or(...searchFilters))
    }

    // Combine all conditions with AND
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined
    
    const filterTime = Date.now() - filterStart
    logger.performance({ operation: 'Filter building', duration: filterTime })

    // Execute queries individually to track timing
    const queryStart = Date.now()
    logger.info('Starting PostgreSQL queries')
    
    // Execute data query
    const dataQueryStart = Date.now()
    const usersList = await db.select()
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)
    const dataQueryTime = Date.now() - dataQueryStart
    logger.dbQuery('Data fetch query', dataQueryTime, usersList.length)
    
    // Execute count query
    const countQueryStart = Date.now()
    const [{ count: totalCount }] = await db.select({ count: count() })
      .from(users)
      .where(whereClause)
    const countQueryTime = Date.now() - countQueryStart
    logger.dbQuery('Count query', countQueryTime)
    
    const totalDbTime = Date.now() - queryStart
    logger.performance({ operation: 'All PostgreSQL queries', duration: totalDbTime, 
      metadata: { totalRecords: totalCount, fetchedRecords: usersList.length } })
    
    const processingStart = Date.now()
    logger.debug('Processing response data')

    // Transform the data to match the expected API format
    const enrichedUsers = usersList

    const result = {
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNext: page < Math.ceil((totalCount || 0) / limit),
        hasPrev: page > 1
      }
    }

    const processingTime = Date.now() - processingStart
    const totalTime = Date.now() - startTime
    
    logger.performance({ operation: 'Response processing', duration: processingTime })
    logger.apiRequest('GET', '/api/users', startTime)
    
    // Performance breakdown with enhanced logging
    logger.performanceBreakdown('Users API Request', {
      'Auth check': authTime,
      'Filter building': filterTime,
      'PostgreSQL queries': totalDbTime,
      '  ├── Data fetch': dataQueryTime,
      '  └── Count query': countQueryTime,
      'Response processing': processingTime
    })
    
    // Add performance headers for monitoring (visible in Network tab)
    const headers = new Headers()
    headers.set('X-Response-Time', `${totalTime}ms`)
    headers.set('X-Auth-Time', `${authTime}ms`)
    headers.set('X-Filter-Time', `${filterTime}ms`)
    headers.set('X-DB-Total-Time', `${totalDbTime}ms`)
    headers.set('X-DB-Data-Time', `${dataQueryTime}ms`)
    headers.set('X-DB-Count-Time', `${countQueryTime}ms`)
    headers.set('X-Processing-Time', `${processingTime}ms`)
    headers.set('X-Records-Fetched', usersList.length.toString())
    headers.set('X-Total-Records', (totalCount || 0).toString())
    
    return NextResponse.json(result, { headers })
  } catch (error) {
    const errorTime = Date.now() - startTime
    logger.error(`Users API error after ${errorTime}ms`, error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}