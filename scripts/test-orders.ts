#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless'
import { MongoClient } from 'mongodb'
import { config } from 'dotenv'

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

const sql = neon(process.env.DATABASE_URL)
const mongoClient = new MongoClient(process.env.MONGODB_URI)

// Test orders migration only
async function testOrdersMigration() {
  console.log('🧪 Testing Orders Migration...')
  
  try {
    await mongoClient.connect()
    const mongoDb = mongoClient.db()
    const ordersCollection = mongoDb.collection('orders')
    
    // Get just 5 orders for testing
    const orders = await ordersCollection.find({}).limit(5).toArray()
    console.log(`Found ${orders.length} orders to test`)
    
    for (const order of orders) {
      try {
        // Map order status to valid PostgreSQL values
        const mapOrderStatus = (status: string) => {
          switch (status?.toUpperCase()) {
            case 'CREATED':
              return 'CREATED'
            case 'PENDING':
              return 'PENDING'
            case 'CONFIRMED':
              return 'CONFIRMED'  
            case 'DELIVERED':
              return 'DELIVERED'
            case 'CANCELLED':
              return 'CANCELLED'
            default:
              return 'PENDING'
          }
        }

        // Map payment status to valid PostgreSQL values  
        const mapPaymentStatus = (status: string) => {
          switch (status?.toUpperCase()) {
            case 'CREATED':
              return 'CREATED'
            case 'ATTEMPTED':
              return 'ATTEMPTED'
            case 'PAID':
              return 'PAID'
            case 'PENDING':
              return 'PENDING'
            case 'FAILED':
              return 'FAILED'
            case 'CASH_ON_DELIVERY':
              return 'CASH_ON_DELIVERY'
            default:
              return 'PENDING'
          }
        }

        // Map delivery status to valid PostgreSQL values
        const mapDeliveryStatus = (status: string) => {
          switch (status?.toUpperCase()) {
            case 'PENDING':
              return 'PENDING'
            case 'PREPARING':
              return 'PREPARING'  
            case 'PREPARING_FOR_DISPATCH':
              return 'PREPARING_FOR_DISPATCH'
            case 'DISPATCHED':
              return 'DISPATCHED'
            case 'DELIVERED':
              return 'DELIVERED'
            case 'CANCELLED':
              return 'CANCELLED'
            default:
              return 'PENDING'
          }
        }

        console.log(`Testing order ${order.orderId}: status=${order.orderStatus}, payment=${order.paymentStatus}, delivery=${order.deliveryStatus}`)
        console.log(`  Mapped to: status=${mapOrderStatus(order.orderStatus)}, payment=${mapPaymentStatus(order.paymentStatus)}, delivery=${mapDeliveryStatus(order.deliveryStatus)}`)
        
        await sql`
          INSERT INTO orders (
            order_id, user_id, amount, currency, order_status, payment_status, delivery_status,
            time, cash_on_delivery, rewards,
            address_first_name, address_last_name, address_mobile_number, address_alternate_mobile_number,
            address_email, address_line1, address_line2, address_landmark, address_pincode,
            address_city, address_state, address_country,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            razorpay_order_id, razorpay_receipt, razorpay_status, razorpay_payments,
            created_at, updated_at
          ) VALUES (
            ${order.orderId + '_test'},
            ${null},
            ${parseFloat(order.amount)},
            ${order.currency || 'INR'},
            ${mapOrderStatus(order.orderStatus)},
            ${mapPaymentStatus(order.paymentStatus)},
            ${mapDeliveryStatus(order.deliveryStatus)},
            ${order.time ? new Date(order.time) : null},
            ${order.cashOnDelivery || false},
            ${order.rewards || 0},
            ${order.address?.firstName || null},
            ${order.address?.lastName || null},
            ${order.address?.mobileNumber || null},
            ${order.address?.alternateMobileNumber || null},
            ${order.address?.email || null},
            ${order.address?.addressLine1 || null},
            ${order.address?.addressLine2 || null},
            ${order.address?.landmark || null},
            ${order.address?.pincode || null},
            ${order.address?.city || null},
            ${order.address?.state || null},
            ${order.address?.country || null},
            ${order.utmParams?.utm_source || null},
            ${order.utmParams?.utm_medium || null},
            ${order.utmParams?.utm_campaign || null},
            ${order.utmParams?.utm_term || null},
            ${order.utmParams?.utm_content || null},
            ${order.razorpayOrder?.id || null},
            ${order.razorpayOrder?.receipt || null},
            ${order.razorpayOrder?.status || null},
            ${JSON.stringify(order.razorpayOrder?.payments || [])},
            ${order.createdAt ? new Date(order.createdAt) : new Date()},
            ${order.updatedAt ? new Date(order.updatedAt) : new Date()}
          ) RETURNING id
        `
        
        console.log(`  ✅ Successfully inserted order ${order.orderId}`)
        
      } catch (error) {
        console.error(`  ❌ Failed to insert order ${order.orderId}:`, (error as Error).message)
      }
    }
    
    console.log('\n✅ Orders test completed')
    
  } catch (error) {
    console.error('❌ Error in orders test:', error)
    throw error
  } finally {
    await mongoClient.close()
  }
}

testOrdersMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))