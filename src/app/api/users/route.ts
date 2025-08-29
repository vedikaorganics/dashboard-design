import { NextRequest, NextResponse } from 'next/server'
import { db, users } from '@/lib/db'
import { auth } from '@/lib/auth'
import { and, or, like, gte, lt, isNull, isNotNull, count, desc } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

// Force dynamic rendering to ensure console.logs appear in Vercel production
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  console.log('🚀 Users API: Request started')
  
  try {
    // Validate session for security
    const authStart = Date.now()
    const session = await auth.api.getSession({ headers: request.headers })
    const authTime = Date.now() - authStart
    console.log(`🔐 Users API: Auth check completed in ${authTime}ms`)
    
    if (!session?.user) {
      console.log('❌ Users API: Unauthorized request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined
    const phoneVerified = searchParams.get('phoneVerified')?.split(',') || undefined
    const lastOrdered = searchParams.get('lastOrdered')?.split(',') || undefined

    const filterStart = Date.now()
    console.log(`🔍 Users API: Building query filters...`)

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
    console.log(`🔍 Users API: Filter building completed in ${filterTime}ms`)

    // Execute single optimized query with window function for count
    const queryStart = Date.now()
    console.log(`🗄️ Users API: Starting optimized single PostgreSQL query...`)
    
    const singleQueryStart = Date.now()
    const results = await db.select({
      id: users.id,
      userId: users.userId,
      phoneNumber: users.phoneNumber,
      phoneNumberVerified: users.phoneNumberVerified,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      offers: users.offers,
      noOfOrders: users.noOfOrders,
      notes: users.notes,
      lastOrderedOn: users.lastOrderedOn,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      totalCount: sql<number>`COUNT(*) OVER()`.as('total_count')
    })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)
    
    const singleQueryTime = Date.now() - singleQueryStart
    
    // Extract users and total count from combined result
    const usersList = results.map(({ totalCount, ...user }) => user)
    const totalCount = results.length > 0 ? results[0].totalCount : 0
    
    console.log(`📊 Optimized single query completed in ${singleQueryTime}ms (fetched ${usersList.length} users, total: ${totalCount})`)
    
    const totalDbTime = singleQueryTime
    console.log(`🗄️ Database query optimization: reduced from 2 queries to 1 query in ${totalDbTime}ms`)
    
    const processingStart = Date.now()
    console.log(`🔄 Users API: Processing response data...`)

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
    
    console.log(`🔄 Users API: Response processing completed in ${processingTime}ms`)
    console.log(`✅ Users API: Request completed successfully in ${totalTime}ms`)
    console.log(`📈 Performance Breakdown:`)
    console.log(`   ├── Auth check: ${authTime}ms`)
    console.log(`   ├── Filter building: ${filterTime}ms`)
    console.log(`   ├── PostgreSQL query (optimized): ${totalDbTime}ms`)
    console.log(`   │   └── Single query with COUNT() OVER()`)
    console.log(`   ├── Response processing: ${processingTime}ms`)
    console.log(`   └── Total: ${totalTime}ms`)
    
    // Add performance monitoring headers only
    const headers = new Headers()
    
    // Performance monitoring headers
    headers.set('X-Response-Time', `${totalTime}ms`)
    headers.set('X-Auth-Time', `${authTime}ms`)
    headers.set('X-Filter-Time', `${filterTime}ms`)
    headers.set('X-DB-Query-Time', `${totalDbTime}ms`)
    headers.set('X-DB-Query-Type', 'single-optimized')
    headers.set('X-Processing-Time', `${processingTime}ms`)
    headers.set('X-Records-Fetched', usersList.length.toString())
    headers.set('X-Total-Records', (totalCount || 0).toString())
    headers.set('X-Query-Optimization', 'window-function')
    
    // Ensure no caching
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    headers.set('Pragma', 'no-cache')
    headers.set('Expires', '0')
    
    return NextResponse.json(result, { headers })
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`❌ Users API error after ${errorTime}ms:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}