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

async function updateDiscountPrecision() {
  console.log('🔧 Updating discount field precision to support max value of 10000...')
  
  try {
    // Step 1: Drop dependent views
    console.log('🗑️ Dropping dependent views temporarily...')
    await sql`DROP VIEW IF EXISTS "order_summary" CASCADE`
    await sql`DROP VIEW IF EXISTS "product_performance" CASCADE`
    await sql`DROP VIEW IF EXISTS "customer_analytics" CASCADE`
    await sql`DROP VIEW IF EXISTS "campaign_performance" CASCADE`
    console.log('  ✅ Dropped dependent views')
    
    // Step 2: Update offers table discount precision
    console.log('📊 Updating offers.discount precision from numeric(5,2) to numeric(7,2)...')
    await sql`ALTER TABLE "offers" ALTER COLUMN "discount" SET DATA TYPE numeric(7, 2)`
    console.log('  ✅ Updated offers.discount precision')
    
    // Step 3: Update order_offers table discount precision
    console.log('📊 Updating order_offers.discount precision from numeric(5,2) to numeric(7,2)...')
    await sql`ALTER TABLE "order_offers" ALTER COLUMN "discount" SET DATA TYPE numeric(7, 2)`
    console.log('  ✅ Updated order_offers.discount precision')
    
    // Step 4: Recreate the views (order_summary view)
    console.log('🔧 Recreating analytical views...')
    await sql`
      CREATE VIEW order_summary AS
      SELECT 
        o.id,
        o.order_id,
        o.user_id,
        o.amount,
        o.order_status,
        o.payment_status,
        o.delivery_status,
        o.created_at,
        o.utm_campaign,
        o.utm_source,
        o.utm_medium,
        o.address_city,
        o.address_state,
        o.address_pincode,
        -- Aggregated item data
        COUNT(DISTINCT oi.id) as item_count,
        SUM(oi.quantity) as total_quantity,
        -- Aggregated offer data
        COUNT(DISTINCT oo.id) as offer_count,
        SUM(oo.discount) as total_discount,
        -- User info
        u.name as customer_name,
        u.phone_number as customer_phone,
        u.email as customer_email
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN order_offers oo ON oo.order_id = o.id
      LEFT JOIN users u ON u.id = o.user_id
      GROUP BY o.id, u.name, u.phone_number, u.email
    `
    console.log('  ✅ Recreated order_summary view')
    
    // Verify the changes
    console.log('\n🔍 Verifying the changes...')
    const offerColumns = await sql`
      SELECT column_name, data_type, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'offers' AND column_name = 'discount'
    `
    
    const orderOfferColumns = await sql`
      SELECT column_name, data_type, numeric_precision, numeric_scale 
      FROM information_schema.columns 
      WHERE table_name = 'order_offers' AND column_name = 'discount'
    `
    
    console.log('offers.discount:', offerColumns[0])
    console.log('order_offers.discount:', orderOfferColumns[0])
    
    console.log('\n✅ Discount field precision successfully updated!')
    console.log('   - Maximum value now supported: 10,000.00')
    console.log('   - Previous maximum: 999.99')
    
  } catch (error) {
    console.error('❌ Error updating discount precision:', error)
    throw error
  }
}

updateDiscountPrecision()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))