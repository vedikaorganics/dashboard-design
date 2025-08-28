#!/usr/bin/env tsx

import { MongoClient } from 'mongodb'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required')
  process.exit(1)
}

const mongoClient = new MongoClient(process.env.MONGODB_URI)

async function analyzeOrderStatuses() {
  console.log('🔍 Analyzing order statuses in MongoDB...')
  
  try {
    await mongoClient.connect()
    const mongoDb = mongoClient.db()
    const ordersCollection = mongoDb.collection('orders')
    
    // Get unique order statuses
    const orderStatuses = await ordersCollection.distinct('orderStatus')
    console.log('\n📊 Unique Order Statuses:')
    orderStatuses.forEach(status => console.log(`  - "${status}"`))
    
    // Get unique payment statuses
    const paymentStatuses = await ordersCollection.distinct('paymentStatus')
    console.log('\n💳 Unique Payment Statuses:')
    paymentStatuses.forEach(status => console.log(`  - "${status}"`))
    
    // Get unique delivery statuses
    const deliveryStatuses = await ordersCollection.distinct('deliveryStatus')
    console.log('\n🚚 Unique Delivery Statuses:')
    deliveryStatuses.forEach(status => console.log(`  - "${status}"`))
    
    // Count each order status
    console.log('\n📈 Order Status Counts:')
    const statusCounts = await ordersCollection.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray()
    
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  "${_id}": ${count}`)
    })
    
  } catch (error) {
    console.error('❌ Error analyzing statuses:', error)
    throw error
  } finally {
    await mongoClient.close()
  }
}

analyzeOrderStatuses()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))