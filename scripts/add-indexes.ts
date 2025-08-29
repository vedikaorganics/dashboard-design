#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

console.log('🔧 Adding Performance Indexes for Users Table')
console.log('===============================================')

async function addIndexes() {
  const startTime = Date.now()
  
  try {
    console.log('📊 Creating indexes...')
    
    // Create created_at index for ORDER BY performance
    console.log('1. Creating idx_users_created_at index...')
    await sql`CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users" USING btree ("created_at" DESC NULLS LAST)`
    console.log('✅ Created idx_users_created_at')
    
    // Create composite index for common query patterns
    console.log('2. Creating idx_users_created_at_filters composite index...')
    await sql`CREATE INDEX IF NOT EXISTS "idx_users_created_at_filters" ON "users" USING btree ("created_at" DESC NULLS LAST, "phone_number_verified")`
    console.log('✅ Created idx_users_created_at_filters')
    
    // Verify indexes were created
    console.log('\n🔍 Verifying indexes...')
    const indexes = await sql`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname IN ('idx_users_created_at', 'idx_users_created_at_filters')
      ORDER BY indexname
    `
    
    if (indexes.length === 2) {
      console.log('✅ All indexes created successfully:')
      indexes.forEach((idx: any) => {
        console.log(`   - ${idx.indexname}`)
      })
    } else {
      console.log(`⚠️  Only ${indexes.length}/2 indexes were created`)
    }
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    console.log(`\n🎉 Index creation completed in ${duration} seconds`)
    console.log('\n📈 Expected Performance Impact:')
    console.log('   - ORDER BY created_at DESC: 70-90% faster')
    console.log('   - Filtered queries: 40-60% faster')
    console.log('   - Overall API response: 200ms+ → 50-100ms')
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error)
    throw error
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n❌ Index creation interrupted by user')
  process.exit(130)
})

// Run the function
addIndexes().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})