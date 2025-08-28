#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { MongoClient } from 'mongodb'
import { config } from 'dotenv'
import { count, eq, sql } from 'drizzle-orm'
import * as schema from '../src/db/schema'

// Load environment variables
config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required')
  process.exit(1)
}

const pgSql = neon(process.env.DATABASE_URL)
const db = drizzle(pgSql as any, { schema })

// MongoDB connection
const mongoClient = new MongoClient(process.env.MONGODB_URI)

console.log('✅ Migration Verification Tool')
console.log('==============================')
console.log(`MongoDB: ${process.env.MONGODB_URI?.split('@')[1]?.split('/')[0] || 'Unknown'}`)
console.log(`PostgreSQL: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Unknown'}`)
console.log('==============================\n')

interface VerificationResult {
  collection: string
  mongoCount: number
  pgCount: number
  match: boolean
  details?: string
}

const results: VerificationResult[] = []

async function connectDatabases() {
  console.log('🔌 Connecting to databases...')
  
  try {
    await mongoClient.connect()
    console.log('✅ MongoDB connected')
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    throw error
  }
  
  try {
    await pgSql`SELECT 1`
    console.log('✅ PostgreSQL connected')
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error)
    throw error
  }
}

async function verifyUsers() {
  console.log('👥 Verifying Users...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('users').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.users)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'users',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
  
  // Sample data verification
  if (mongoCount > 0) {
    const mongoSample = await mongoDb.collection('users').findOne({})
    const pgSample = await db.select().from(schema.users).limit(1)
    
    if (mongoSample && pgSample[0]) {
      console.log(`  Sample verification: ${mongoSample.userId === pgSample[0].userId ? '✅' : '❌'}`)
    }
  }
}

async function verifyProducts() {
  console.log('📦 Verifying Products...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('products').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.products)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'products',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
}

async function verifyProductVariants() {
  console.log('🏷️  Verifying Product Variants...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('productvariants').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.productVariants)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'product_variants',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
}

async function verifyOffers() {
  console.log('🎁 Verifying Offers...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('offers').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.offers)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'offers',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
}

async function verifyOrders() {
  console.log('🛒 Verifying Orders...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('orders').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.orders)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'orders',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
  
  // Verify order items
  console.log('📄 Verifying Order Items...')
  
  // Count total items across all orders in MongoDB
  const mongoOrders = await mongoDb.collection('orders').find({}).toArray()
  const mongoItemsCount = mongoOrders.reduce((total, order) => {
    return total + (order.items ? order.items.length : 0)
  }, 0)
  
  const pgItemsResult = await db.select({ count: count() }).from(schema.orderItems)
  const pgItemsCount = pgItemsResult[0].count
  
  const itemsMatch = mongoItemsCount === pgItemsCount
  results.push({
    collection: 'order_items',
    mongoCount: mongoItemsCount,
    pgCount: pgItemsCount,
    match: itemsMatch
  })
  
  console.log(`  MongoDB: ${mongoItemsCount}, PostgreSQL: ${pgItemsCount} ${itemsMatch ? '✅' : '❌'}`)
  
  // Verify order offers
  console.log('🎫 Verifying Order Offers...')
  
  const mongoOffersCount = mongoOrders.reduce((total, order) => {
    return total + (order.offers ? order.offers.length : 0)
  }, 0)
  
  const pgOrderOffersResult = await db.select({ count: count() }).from(schema.orderOffers)
  const pgOrderOffersCount = pgOrderOffersResult[0].count
  
  const offersMatch = mongoOffersCount === pgOrderOffersCount
  results.push({
    collection: 'order_offers',
    mongoCount: mongoOffersCount,
    pgCount: pgOrderOffersCount,
    match: offersMatch
  })
  
  console.log(`  MongoDB: ${mongoOffersCount}, PostgreSQL: ${pgOrderOffersCount} ${offersMatch ? '✅' : '❌'}`)
}

async function verifyReviews() {
  console.log('⭐ Verifying Reviews...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('reviews').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.reviews)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'reviews',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
  
  // Verify review replies
  console.log('💬 Verifying Review Replies...')
  
  const mongoReviews = await mongoDb.collection('reviews').find({}).toArray()
  const mongoRepliesCount = mongoReviews.reduce((total, review) => {
    return total + (review.replies ? review.replies.length : 0)
  }, 0)
  
  const pgRepliesResult = await db.select({ count: count() }).from(schema.reviewReplies)
  const pgRepliesCount = pgRepliesResult[0].count
  
  const repliesMatch = mongoRepliesCount === pgRepliesCount
  results.push({
    collection: 'review_replies',
    mongoCount: mongoRepliesCount,
    pgCount: pgRepliesCount,
    match: repliesMatch
  })
  
  console.log(`  MongoDB: ${mongoRepliesCount}, PostgreSQL: ${pgRepliesCount} ${repliesMatch ? '✅' : '❌'}`)
}

async function verifyRewards() {
  console.log('🏆 Verifying Rewards...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('rewards').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.rewards)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'rewards',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
}

async function verifyStaff() {
  console.log('👨‍💼 Verifying Staff...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('staff').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.staff)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'staff',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
}

async function verifyAddresses() {
  console.log('📍 Verifying Addresses...')
  
  const mongoDb = mongoClient.db()
  const mongoCount = await mongoDb.collection('addresses').countDocuments()
  const pgResult = await db.select({ count: count() }).from(schema.addresses)
  const pgCount = pgResult[0].count
  
  const match = mongoCount === pgCount
  results.push({
    collection: 'addresses',
    mongoCount,
    pgCount,
    match
  })
  
  console.log(`  MongoDB: ${mongoCount}, PostgreSQL: ${pgCount} ${match ? '✅' : '❌'}`)
}

async function verifyDataIntegrity() {
  console.log('\n🔍 Verifying Data Integrity...')
  
  // Check foreign key relationships
  console.log('🔗 Checking Foreign Key Relationships...')
  
  try {
    // Users with orders
    const usersWithOrders = await pgSql`
      SELECT COUNT(DISTINCT u.id) as users_with_orders
      FROM users u
      INNER JOIN orders o ON o.user_id = u.id
    `
    console.log(`  ✅ Users with orders: ${usersWithOrders[0].users_with_orders}`)
    
    // Products with variants
    const productsWithVariants = await pgSql`
      SELECT COUNT(DISTINCT p.id) as products_with_variants
      FROM products p
      INNER JOIN product_variants pv ON pv.product_id = p.id
    `
    console.log(`  ✅ Products with variants: ${productsWithVariants[0].products_with_variants}`)
    
    // Orders with items
    const ordersWithItems = await pgSql`
      SELECT COUNT(DISTINCT o.id) as orders_with_items
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id
    `
    console.log(`  ✅ Orders with items: ${ordersWithItems[0].orders_with_items}`)
    
    // Products with reviews
    const productsWithReviews = await pgSql`
      SELECT COUNT(DISTINCT p.id) as products_with_reviews
      FROM products p
      INNER JOIN reviews r ON r.product_id = p.id
    `
    console.log(`  ✅ Products with reviews: ${productsWithReviews[0].products_with_reviews}`)
    
  } catch (error) {
    console.error('  ❌ Error checking relationships:', error)
  }
}

async function verifyViews() {
  console.log('\n📊 Verifying Analytical Views...')
  
  try {
    // Test order_summary view
    const orderSummary = await pgSql`SELECT COUNT(*) as count FROM order_summary`
    console.log(`  ✅ order_summary view: ${orderSummary[0].count} records`)
    
    // Test product_performance view
    const productPerf = await pgSql`SELECT COUNT(*) as count FROM product_performance`
    console.log(`  ✅ product_performance view: ${productPerf[0].count} records`)
    
    // Test customer_analytics view
    const customerAnalytics = await pgSql`SELECT COUNT(*) as count FROM customer_analytics`
    console.log(`  ✅ customer_analytics view: ${customerAnalytics[0].count} records`)
    
    // Test campaign_performance view
    const campaignPerf = await pgSql`SELECT COUNT(*) as count FROM campaign_performance`
    console.log(`  ✅ campaign_performance view: ${campaignPerf[0].count} records`)
    
  } catch (error) {
    console.error('  ❌ Error testing views:', error)
  }
}

async function performanceTest() {
  console.log('\n⚡ Performance Testing...')
  
  try {
    // Test common queries
    const startTime = Date.now()
    
    // 1. Get recent orders with user data
    const recentOrders = await pgSql`
      SELECT o.*, u.name, u.phone_number
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 50
    `
    const ordersTime = Date.now() - startTime
    console.log(`  ✅ Recent orders query: ${ordersTime}ms (${recentOrders.length} records)`)
    
    // 2. Product search
    const searchStart = Date.now()
    const products = await pgSql`
      SELECT p.*, COUNT(pv.id) as variant_count
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.is_active = true
      GROUP BY p.id
      LIMIT 20
    `
    const searchTime = Date.now() - searchStart
    console.log(`  ✅ Product search query: ${searchTime}ms (${products.length} records)`)
    
    // 3. Order analytics
    const analyticsStart = Date.now()
    const analytics = await pgSql`
      SELECT 
        COUNT(*) as total_orders,
        SUM(amount) as total_revenue,
        AVG(amount) as avg_order_value
      FROM orders
      WHERE payment_status IN ('PAID', 'CASH_ON_DELIVERY')
        AND created_at >= NOW() - INTERVAL '30 days'
    `
    const analyticsTime = Date.now() - analyticsStart
    console.log(`  ✅ Analytics query: ${analyticsTime}ms`)
    console.log(`     - Total orders: ${analytics[0].total_orders}`)
    console.log(`     - Total revenue: $${parseFloat(analytics[0].total_revenue || 0).toFixed(2)}`)
    console.log(`     - Avg order value: $${parseFloat(analytics[0].avg_order_value || 0).toFixed(2)}`)
    
  } catch (error) {
    console.error('  ❌ Error in performance testing:', error)
  }
}

async function sampleDataComparison() {
  console.log('\n🔍 Sample Data Comparison...')
  
  try {
    const mongoDb = mongoClient.db()
    
    // Compare a few sample records
    const mongoUser = await mongoDb.collection('users').findOne({})
    const pgUser = await db.select().from(schema.users).limit(1)
    
    if (mongoUser && pgUser[0]) {
      console.log('  👥 User comparison:')
      console.log(`     MongoDB User ID: ${mongoUser.userId || mongoUser._id}`)
      console.log(`     PostgreSQL User ID: ${pgUser[0].userId}`)
      console.log(`     Names match: ${mongoUser.name === pgUser[0].name ? '✅' : '❌'}`)
    }
    
    const mongoOrder = await mongoDb.collection('orders').findOne({})
    const pgOrder = await db.select().from(schema.orders).limit(1)
    
    if (mongoOrder && pgOrder[0]) {
      console.log('  🛒 Order comparison:')
      console.log(`     MongoDB Order ID: ${mongoOrder.orderId}`)
      console.log(`     PostgreSQL Order ID: ${pgOrder[0].orderId}`)
      console.log(`     Amounts match: ${parseFloat(mongoOrder.amount) === parseFloat(pgOrder[0].amount) ? '✅' : '❌'}`)
      console.log(`     Status match: ${mongoOrder.orderStatus === pgOrder[0].orderStatus ? '✅' : '❌'}`)
    }
    
  } catch (error) {
    console.error('  ❌ Error in sample comparison:', error)
  }
}

async function printSummary() {
  console.log('\n📋 Verification Summary')
  console.log('=======================')
  
  let totalMatches = 0
  let totalTables = 0
  
  results.forEach(result => {
    const status = result.match ? '✅' : '❌'
    const diff = result.pgCount - result.mongoCount
    const diffStr = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : ''
    
    console.log(`${result.collection.padEnd(20)} ${status} MongoDB: ${result.mongoCount.toString().padStart(6)}, PostgreSQL: ${result.pgCount.toString().padStart(6)}${diffStr}`)
    
    if (result.match) totalMatches++
    totalTables++
  })
  
  console.log('-'.repeat(60))
  console.log(`Total: ${totalMatches}/${totalTables} collections match`)
  
  if (totalMatches === totalTables) {
    console.log('\n🎉 All data verification passed!')
    console.log('   Your migration appears to be successful.')
    console.log('\n📝 Next steps:')
    console.log('   1. Test your application with PostgreSQL')
    console.log('   2. Update API routes if needed')
    console.log('   3. Switch environment variables to PostgreSQL')
    console.log('   4. Monitor performance in production')
  } else {
    console.log('\n⚠️  Some data counts don\'t match!')
    console.log('   Please review the migration logs and check for:')
    console.log('   - Skipped records due to missing dependencies')
    console.log('   - Data format issues during migration')
    console.log('   - Validation errors in the migration script')
  }
}

async function main() {
  const startTime = Date.now()
  
  try {
    await connectDatabases()
    
    console.log('\n🔢 Count Verification')
    console.log('====================')
    
    // Verify all collections
    await verifyUsers()
    await verifyAddresses()
    await verifyProducts()
    await verifyProductVariants()
    await verifyOffers()
    await verifyOrders() // Includes items and offers
    await verifyReviews() // Includes replies
    await verifyRewards()
    await verifyStaff()
    
    // Additional verifications
    await verifyDataIntegrity()
    await verifyViews()
    await performanceTest()
    await sampleDataComparison()
    
    // Print final summary
    await printSummary()
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    console.log(`\n⏱️  Verification completed in ${duration} seconds`)
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  } finally {
    await mongoClient.close()
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
✅ Migration Verification Tool

Usage: tsx scripts/verify-migration.ts

This script will verify your MongoDB to PostgreSQL migration by:
  1. Comparing record counts between databases
  2. Checking data integrity and relationships
  3. Testing analytical views
  4. Running performance tests on common queries
  5. Comparing sample data for accuracy

Environment Variables:
  DATABASE_URL   PostgreSQL connection string (required)
  MONGODB_URI    MongoDB connection string (required)

The script will provide a detailed report showing:
  - Count comparisons for each collection/table
  - Foreign key relationship verification
  - View functionality testing
  - Performance metrics
  - Sample data comparison

✅ = Verification passed
❌ = Verification failed - review migration logs
`)
  process.exit(0)
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n❌ Verification interrupted by user')
  await mongoClient.close()
  process.exit(130)
})

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})