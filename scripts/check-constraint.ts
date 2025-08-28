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

async function checkConstraint() {
  console.log('🔍 Checking order status constraint...')
  
  try {
    const result = await sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname = 'order_status_check' AND contype = 'c'
    `
    
    if (result.length > 0) {
      console.log('✅ Found constraint:')
      console.log(`  Name: ${result[0].constraint_name}`)
      console.log(`  Definition: ${result[0].constraint_definition}`)
    } else {
      console.log('❌ No constraint found with name "order_status_check"')
    }
    
    // Also test if CREATED is accepted
    console.log('\n🧪 Testing CREATED status...')
    try {
      await sql`SELECT 'CREATED' as test_status WHERE 'CREATED' IN ('CREATED', 'CONFIRMED', 'PENDING', 'DELIVERED', 'CANCELLED')`
      console.log('✅ CREATED status test passed')
    } catch (err) {
      console.log('❌ CREATED status test failed:', err)
    }
    
  } catch (error) {
    console.error('❌ Error checking constraint:', error)
    throw error
  }
}

checkConstraint()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))