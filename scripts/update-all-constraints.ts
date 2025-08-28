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

async function updateAllConstraints() {
  console.log('🔧 Updating all order constraints...')
  
  try {
    // Update Payment Status Constraint
    console.log('\n💳 Updating payment status constraint...')
    await sql`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "payment_status_check"`
    await sql`ALTER TABLE "orders" ADD CONSTRAINT "payment_status_check" CHECK (payment_status IN ('CREATED', 'ATTEMPTED', 'PAID', 'PENDING', 'FAILED', 'CASH_ON_DELIVERY'))`
    console.log('  ✓ Updated payment status constraint')
    
    // Update Delivery Status Constraint
    console.log('\n🚚 Updating delivery status constraint...')
    await sql`ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "delivery_status_check"`
    await sql`ALTER TABLE "orders" ADD CONSTRAINT "delivery_status_check" CHECK (delivery_status IN ('PENDING', 'PREPARING', 'PREPARING_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED'))`
    console.log('  ✓ Updated delivery status constraint')
    
    // Verify all constraints
    console.log('\n🔍 Verifying all constraints...')
    const constraints = await sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname LIKE '%_status_check' AND contype = 'c'
      ORDER BY conname
    `
    
    constraints.forEach(({ constraint_name, constraint_definition }) => {
      console.log(`  ${constraint_name}:`)
      console.log(`    ${constraint_definition}`)
    })
    
    console.log('\n✅ All order constraints updated successfully')
  } catch (error) {
    console.error('❌ Error updating constraints:', error)
    throw error
  }
}

updateAllConstraints()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))