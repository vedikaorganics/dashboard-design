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

async function updateOrderStatusConstraint() {
  console.log('🔧 Updating order status constraint...')
  
  try {
    // First check current constraint
    const currentConstraint = await sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname = 'order_status_check' AND contype = 'c'
    `
    
    if (currentConstraint.length > 0) {
      console.log('  Current constraint:', currentConstraint[0].constraint_definition)
      
      // Drop the old constraint
      await sql`ALTER TABLE "orders" DROP CONSTRAINT "order_status_check"`
      console.log('  ✓ Dropped old constraint')
    } else {
      console.log('  No existing constraint found')
    }
    
    // Add the new constraint with CREATED status
    await sql`ALTER TABLE "orders" ADD CONSTRAINT "order_status_check" CHECK (order_status IN ('CREATED', 'CONFIRMED', 'PENDING', 'DELIVERED', 'CANCELLED'))`
    console.log('  ✓ Added new constraint with CREATED status')
    
    // Verify the new constraint
    const newConstraint = await sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname = 'order_status_check' AND contype = 'c'
    `
    
    if (newConstraint.length > 0) {
      console.log('  New constraint:', newConstraint[0].constraint_definition)
    }
    
    console.log('✅ Order status constraint updated successfully')
  } catch (error) {
    console.error('❌ Error updating constraint:', error)
    throw error
  }
}

updateOrderStatusConstraint()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))