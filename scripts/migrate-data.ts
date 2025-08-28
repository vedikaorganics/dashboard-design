#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless'
import { MongoClient, ObjectId } from 'mongodb'
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

// Command line flags
const args = process.argv.slice(2)
const isCleanRun = args.includes('--clean')
const isTestRun = args.includes('--test')
const isParallel = args.includes('--parallel')
const testLimit = isTestRun ? 100 : undefined

// Configuration
const getBatchSize = () => {
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='))
  return batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 100
}
const BATCH_SIZE = getBatchSize()

// ID mapping to track MongoDB ObjectId to PostgreSQL UUID relationships
const idMapping = {
  users: new Map<string, string>(),
  products: new Map<string, string>(),
  offers: new Map<string, string>(),
  orders: new Map<string, string>()
}

// Statistics tracking
const stats = {
  users: { migrated: 0, errors: 0 },
  addresses: { migrated: 0, errors: 0 },
  products: { migrated: 0, errors: 0 },
  variants: { migrated: 0, errors: 0 },
  offers: { migrated: 0, errors: 0 },
  orders: { migrated: 0, errors: 0 },
  orderItems: { migrated: 0, errors: 0 },
  orderOffers: { migrated: 0, errors: 0 },
  reviews: { migrated: 0, errors: 0 },
  rewards: { migrated: 0, errors: 0 },
  staff: { migrated: 0, errors: 0 }
}

// Status mapping functions
const mapOrderStatus = (status: string): string => {
  switch (status?.toUpperCase()) {
    case 'CREATED':
      return 'CREATED'
    case 'CONFIRMED':
      return 'CONFIRMED'
    case 'PENDING':
      return 'PENDING'
    case 'DELIVERED':
      return 'DELIVERED'
    case 'CANCELLED':
      return 'CANCELLED'
    default:
      return 'PENDING'
  }
}

const mapPaymentStatus = (status: string): string => {
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

const mapDeliveryStatus = (status: string): string => {
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

// Color utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const colorLog = (color: string, message: string) => {
  console.log(`${color}${message}${colors.reset}`)
}

// Utility function to split array into batches
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Progress tracking utility
function createProgressTracker(collectionName: string, total: number) {
  let processed = 0
  const startTime = Date.now()
  
  return {
    update: (count: number) => {
      processed += count
      const elapsed = (Date.now() - startTime) / 1000
      const rate = processed / elapsed
      const percentage = ((processed / total) * 100).toFixed(1)
      colorLog(colors.cyan, `  📊 ${collectionName}: ${processed}/${total} (${percentage}%) - ${rate.toFixed(1)} records/sec`)
    },
    finish: () => {
      const elapsed = (Date.now() - startTime) / 1000
      const rate = processed / elapsed
      colorLog(colors.green, `  ✅ ${collectionName}: Completed ${processed} records in ${elapsed.toFixed(2)}s (${rate.toFixed(1)} records/sec)`)
    }
  }
}

// Utility function to log detailed error information
function logDetailedError(collectionName: string, documentId: string, error: unknown, document: any, fieldLimits?: Record<string, number>) {
  const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error)
  colorLog(colors.red, `❌ ${collectionName} ${documentId}: ${errorMessage}`)
  
  if (fieldLimits && errorMessage.includes('value too long')) {
    colorLog(colors.red, `   📏 Field length analysis:`)
    Object.entries(fieldLimits).forEach(([fieldName, maxLength]) => {
      const fieldValue = document[fieldName]
      const actualLength = fieldValue ? fieldValue.toString().length : 0
      const status = actualLength > maxLength ? '❌ TOO LONG' : '✅'
      colorLog(colors.red, `      - ${fieldName}: ${actualLength}/${maxLength} chars ${status}`)
      if (actualLength > maxLength && fieldValue) {
        colorLog(colors.red, `        Value: "${fieldValue.toString()}"`)
      }
    })
  }
  
  if ((error instanceof Error ? error.message : String(error)).includes('constraint')) {
    colorLog(colors.red, `   🔗 Constraint violation detected`)
    colorLog(colors.red, `   📄 Document: ${JSON.stringify(document, null, 2)}`)
  } else if ((error instanceof Error ? error.message : String(error)).includes('duplicate key')) {
    colorLog(colors.red, `   🔑 Duplicate key error - document may already exist`)
  } else {
    colorLog(colors.red, `   📄 Full document: ${JSON.stringify(document, null, 2)}`)
  }
}

// Clean PostgreSQL tables if --clean flag is provided
async function cleanDatabase() {
  if (!isCleanRun) return

  colorLog(colors.yellow, '🧹 Cleaning PostgreSQL database...')
  
  try {
    // Delete in dependency order (children first)
    await sql`DELETE FROM review_replies`
    await sql`DELETE FROM order_offers`
    await sql`DELETE FROM order_items`
    await sql`DELETE FROM reviews`
    await sql`DELETE FROM rewards`
    await sql`DELETE FROM sessions`
    await sql`DELETE FROM addresses`
    await sql`DELETE FROM orders`
    await sql`DELETE FROM product_variants`
    await sql`DELETE FROM products`
    await sql`DELETE FROM offers`
    await sql`DELETE FROM users`
    await sql`DELETE FROM staff`
    
    colorLog(colors.green, '✅ Database cleaned successfully')
  } catch (error) {
    colorLog(colors.red, `❌ Error cleaning database: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate users collection
async function migrateUsers(mongoDb: any) {
  colorLog(colors.blue, '👥 Migrating users...')
  
  try {
    const usersCollection = mongoDb.collection('users')
    const query = testLimit ? usersCollection.find({}).limit(testLimit) : usersCollection.find({})
    const users = await query.toArray()
    
    colorLog(colors.cyan, `Found ${users.length} users to migrate`)
    const progress = createProgressTracker('Users', users.length)
    
    const userBatches = chunkArray(users, BATCH_SIZE)
    
    for (const batch of userBatches) {
      try {
        const queries = []
        const validUsers = []
        
        // Process each user individually to catch field-level issues
        for (const user of batch as any[]) {
          try {
            // Validate and prepare fields
            const userData = {
              user_id: user.userId || user._id.toString(),
              phone_number: user.phoneNumber || '',
              phone_number_verified: user.phoneNumberVerified || false,
              email: user.email || null,
              name: user.name || null,
              avatar: user.avatar || null,
              offers: user.offers ? user.offers : [],
              no_of_orders: user.noOfOrders || 0,
              notes: user.notes || null,
              last_ordered_on: user.lastOrderedOn ? new Date(user.lastOrderedOn) : null,
              created_at: user.createdAt ? new Date(user.createdAt) : new Date(),
              updated_at: user.updatedAt ? new Date(user.updatedAt) : new Date()
            }
            
            queries.push(sql`
              INSERT INTO users (
                user_id, phone_number, phone_number_verified, email, name, avatar,
                offers, no_of_orders, notes, last_ordered_on, created_at, updated_at
              ) VALUES (
                ${userData.user_id},
                ${userData.phone_number},
                ${userData.phone_number_verified},
                ${userData.email},
                ${userData.name},
                ${userData.avatar},
                ${userData.offers},
                ${userData.no_of_orders},
                ${userData.notes},
                ${userData.last_ordered_on},
                ${userData.created_at},
                ${userData.updated_at}
              ) RETURNING id
            `)
            
            validUsers.push(user)
            
          } catch (fieldError) {
            colorLog(colors.red, `❌ User ${user._id}: Field validation error`)
            colorLog(colors.red, `   📄 Document: ${JSON.stringify(user, null, 2)}`)
            colorLog(colors.red, `   🔍 Error: ${fieldError instanceof Error ? fieldError.message : String(fieldError)}`)
            stats.users.errors++
          }
        }
        
        if (queries.length > 0) {
          const results = await sql.transaction(queries)
          
          // Map results back to users for ID tracking
          validUsers.forEach((user: any, index: number) => {
            if (results[index] && results[index][0]) {
              idMapping.users.set(user._id.toString(), results[index][0].id)
              stats.users.migrated++
            }
          })
        }
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Batch transaction error: ${(error instanceof Error ? error.message : String(error))}`)
        
        // Fallback: process each user individually to identify the problematic one
        for (const user of batch as any[]) {
          try {
            const result = await sql`
              INSERT INTO users (
                user_id, phone_number, phone_number_verified, email, name, avatar,
                offers, no_of_orders, notes, last_ordered_on, created_at, updated_at
              ) VALUES (
                ${user.userId || user._id.toString()},
                ${user.phoneNumber || ''},
                ${user.phoneNumberVerified || false},
                ${user.email || null},
                ${user.name || null},
                ${user.avatar || null},
                ${user.offers ? user.offers : []},
                ${user.noOfOrders || 0},
                ${user.notes || null},
                ${user.lastOrderedOn ? new Date(user.lastOrderedOn) : null},
                ${user.createdAt ? new Date(user.createdAt) : new Date()},
                ${user.updatedAt ? new Date(user.updatedAt) : new Date()}
              ) RETURNING id
            `
            
            idMapping.users.set(user._id.toString(), result[0].id)
            stats.users.migrated++
            
          } catch (individualError) {
            const userFieldLimits = {
              userId: 255,
              phoneNumber: 20,
              email: 255,
              name: 255,
              avatar: 500
            }
            
            logDetailedError('User', user._id, individualError as Error, user, userFieldLimits)
            stats.users.errors++
          }
        }
      }
    }
    
    progress.finish()
    
    colorLog(colors.green, `✅ Users migration completed: ${stats.users.migrated} migrated, ${stats.users.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in users migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate addresses collection
async function migrateAddresses(mongoDb: any) {
  colorLog(colors.blue, '🏠 Migrating addresses...')
  
  try {
    const addressesCollection = mongoDb.collection('addresses')
    const query = testLimit ? addressesCollection.find({}).limit(testLimit) : addressesCollection.find({})
    const addresses = await query.toArray()
    
    colorLog(colors.cyan, `Found ${addresses.length} addresses to migrate`)
    const progress = createProgressTracker('Addresses', addresses.length)
    
    const addressBatches = chunkArray(addresses, BATCH_SIZE)
    
    for (const batch of addressBatches) {
      try {
        // Filter out addresses without valid users first
        const validAddresses = batch.filter((address: any) => {
          const userPgId = idMapping.users.get(address.userId?.toString())
          if (!userPgId) {
            colorLog(colors.yellow, `⚠️ Skipping address ${address._id} - user not found`)
            return false
          }
          return true
        })
        
        if (validAddresses.length === 0) {
          progress.update(batch.length)
          continue
        }
        
        const queries = validAddresses.map((address: any) => {
          const userPgId = idMapping.users.get(address.userId?.toString())
          return sql`
            INSERT INTO addresses (
              address_id, user_id, first_name, last_name, mobile_number,
              alternate_mobile_number, email, address_line1, address_line2,
              landmark, pincode, city, state, country, is_default,
              created_at, updated_at
            ) VALUES (
              ${address.addressId || address._id.toString()},
              ${userPgId},
              ${address.firstName || null},
              ${address.lastName || null},
              ${address.mobileNumber || null},
              ${address.alternateMobileNumber || null},
              ${address.email || null},
              ${address.addressLine1 || null},
              ${address.addressLine2 || null},
              ${address.landmark || null},
              ${address.pincode || null},
              ${address.city || null},
              ${address.state || null},
              ${address.country || null},
              ${address.isDefault || false},
              ${address.createdAt ? new Date(address.createdAt) : new Date()},
              ${address.updatedAt ? new Date(address.updatedAt) : new Date()}
            )
          `
        })
        
        await sql.transaction(queries)
        stats.addresses.migrated += validAddresses.length
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Error processing address batch: ${(error instanceof Error ? error.message : String(error))}`)
        
        // Fallback: process each address individually to identify the problematic one
        for (const address of batch as any[]) {
          try {
            const userPgId = idMapping.users.get(address.userId?.toString())
            if (!userPgId) {
              colorLog(colors.yellow, `⚠️ Skipping address ${address._id} - user not found`)
              continue
            }
            
            await sql`
              INSERT INTO addresses (
                address_id, user_id, first_name, last_name, mobile_number,
                alternate_mobile_number, email, address_line1, address_line2,
                landmark, pincode, city, state, country, is_default,
                created_at, updated_at
              ) VALUES (
                ${address.addressId || address._id.toString()},
                ${userPgId},
                ${address.firstName || null},
                ${address.lastName || null},
                ${address.mobileNumber || null},
                ${address.alternateMobileNumber || null},
                ${address.email || null},
                ${address.addressLine1 || null},
                ${address.addressLine2 || null},
                ${address.landmark || null},
                ${address.pincode || null},
                ${address.city || null},
                ${address.state || null},
                ${address.country || null},
                ${address.isDefault || false},
                ${address.createdAt ? new Date(address.createdAt) : new Date()},
                ${address.updatedAt ? new Date(address.updatedAt) : new Date()}
              )
            `
            
            stats.addresses.migrated++
            
          } catch (individualError) {
            const addressFieldLimits = {
              firstName: 100,
              lastName: 100,
              city: 100,
              state: 100,
              country: 100,
              landmark: 255,
              pincode: 10,
              mobileNumber: 20,
              alternateMobileNumber: 20,
              email: 255
            }
            
            logDetailedError('Address', address._id, individualError as Error, address, addressFieldLimits)
            stats.addresses.errors++
          }
        }
      }
    }
    
    progress.finish()
    colorLog(colors.green, `✅ Addresses migration completed: ${stats.addresses.migrated} migrated, ${stats.addresses.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in addresses migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate products collection
async function migrateProducts(mongoDb: any) {
  colorLog(colors.blue, '📦 Migrating products...')
  
  try {
    const productsCollection = mongoDb.collection('products')
    const query = testLimit ? productsCollection.find({}).limit(testLimit) : productsCollection.find({})
    const products = await query.toArray()
    
    colorLog(colors.cyan, `Found ${products.length} products to migrate`)
    const progress = createProgressTracker('Products', products.length)
    
    const productBatches = chunkArray(products, BATCH_SIZE)
    
    for (const batch of productBatches) {
      try {
        const queries = batch.map((product: any) => sql`
          INSERT INTO products (
            product_id, title, description, color_hex, bullet_points,
            main_variant, sections, badges, tags, is_active,
            created_at, updated_at
          ) VALUES (
            ${product.id || product._id.toString()},
            ${product.title || ''},
            ${product.description || null},
            ${product.colorHex || null},
            ${JSON.stringify(product.bulletPoints || [])},
            ${product.mainVariant || null},
            ${JSON.stringify(product.sections || [])},
            ${product.badges || []},
            ${product.tags || []},
            ${product.isActive !== false},
            ${product.createdAt ? new Date(product.createdAt) : new Date()},
            ${product.updatedAt ? new Date(product.updatedAt) : new Date()}
          ) RETURNING id
        `)
        
        const results = await sql.transaction(queries)
        
        // Map results back to products for ID tracking
        batch.forEach((product: any, index: number) => {
          if (results[index] && results[index][0]) {
            idMapping.products.set(product.id || product._id.toString(), results[index][0].id)
            stats.products.migrated++
          }
        })
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Error processing batch: ${(error instanceof Error ? error.message : String(error))}`)
        stats.products.errors += batch.length
      }
    }
    
    progress.finish()
    
    colorLog(colors.green, `✅ Products migration completed: ${stats.products.migrated} migrated, ${stats.products.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in products migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate product variants collection
async function migrateVariants(mongoDb: any) {
  colorLog(colors.blue, '🔧 Migrating product variants...')
  
  try {
    const variantsCollection = mongoDb.collection('productvariants')
    const query = testLimit ? variantsCollection.find({}).limit(testLimit) : variantsCollection.find({})
    const variants = await query.toArray()
    
    colorLog(colors.cyan, `Found ${variants.length} variants to migrate`)
    const progress = createProgressTracker('Variants', variants.length)
    
    const variantBatches = chunkArray(variants, BATCH_SIZE)
    
    for (const batch of variantBatches) {
      try {
        // Filter out variants without valid products first
        const validVariants = batch.filter((variant: any) => {
          const productPgId = idMapping.products.get(variant.productId)
          if (!productPgId) {
            colorLog(colors.yellow, `⚠️ Skipping variant ${variant._id} - product not found`)
            return false
          }
          return true
        })
        
        if (validVariants.length === 0) {
          progress.update(batch.length)
          continue
        }
        
        const queries = validVariants.map((variant: any) => {
          const productPgId = idMapping.products.get(variant.productId)
          return sql`
            INSERT INTO product_variants (
              variant_id, product_id, title, unit, size, price, mrp,
              cover_image, cart_image, other_images, variant_order,
              label, type, is_active, stock_quantity, created_at, updated_at
            ) VALUES (
              ${variant.variantId || variant._id.toString()},
              ${productPgId},
              ${variant.title || ''},
              ${variant.unit || null},
              ${variant.size ? parseFloat(variant.size) : null},
              ${parseFloat(variant.price || 0)},
              ${variant.mrp ? parseFloat(variant.mrp) : null},
              ${variant.coverImage || null},
              ${variant.cartImage || null},
              ${variant.otherImages || []},
              ${variant.variantOrder || 0},
              ${variant.label || null},
              ${variant.type || null},
              ${variant.isActive !== false},
              ${variant.stockQuantity || 0},
              ${variant.createdAt ? new Date(variant.createdAt) : new Date()},
              ${variant.updatedAt ? new Date(variant.updatedAt) : new Date()}
            ) RETURNING id
          `
        })
        
        const results = await sql.transaction(queries)
        stats.variants.migrated += validVariants.length
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Error processing batch: ${(error instanceof Error ? error.message : String(error))}`)
        stats.variants.errors += batch.length
      }
    }
    
    progress.finish()
    
    colorLog(colors.green, `✅ Variants migration completed: ${stats.variants.migrated} migrated, ${stats.variants.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in variants migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate offers collection
async function migrateOffers(mongoDb: any) {
  colorLog(colors.blue, '🎁 Migrating offers...')
  
  try {
    const offersCollection = mongoDb.collection('offers')
    const query = testLimit ? offersCollection.find({}).limit(testLimit) : offersCollection.find({})
    const offers = await query.toArray()
    
    colorLog(colors.cyan, `Found ${offers.length} offers to migrate`)
    const progress = createProgressTracker('Offers', offers.length)
    
    const offerBatches = chunkArray(offers, BATCH_SIZE)
    
    for (const batch of offerBatches) {
      try {
        const queries = batch.map((offer: any) => sql`
          INSERT INTO offers (
            offer_id, title, description, discount, is_user_offer,
            trigger_price, is_active, valid_from, valid_until,
            created_at, updated_at
          ) VALUES (
            ${offer.offerId || offer._id.toString()},
            ${offer.title || 'Unknown Offer'},
            ${offer.description || null},
            ${parseFloat(offer.discount || 0)},
            ${offer.isUserOffer || false},
            ${offer.triggerPrice ? parseFloat(offer.triggerPrice) : null},
            ${offer.isActive !== false},
            ${offer.validFrom ? new Date(offer.validFrom) : null},
            ${offer.validUntil ? new Date(offer.validUntil) : null},
            ${offer.createdAt ? new Date(offer.createdAt) : new Date()},
            ${offer.updatedAt ? new Date(offer.updatedAt) : new Date()}
          ) RETURNING id
        `)
        
        const results = await sql.transaction(queries)
        
        // Map results back to offers for ID tracking
        batch.forEach((offer: any, index: number) => {
          if (results[index] && results[index][0]) {
            idMapping.offers.set(offer._id.toString(), results[index][0].id)
            stats.offers.migrated++
          }
        })
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Error processing batch: ${(error instanceof Error ? error.message : String(error))}`)
        stats.offers.errors += batch.length
      }
    }
    
    progress.finish()
    
    colorLog(colors.green, `✅ Offers migration completed: ${stats.offers.migrated} migrated, ${stats.offers.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in offers migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate orders collection
async function migrateOrders(mongoDb: any) {
  colorLog(colors.blue, '🛒 Migrating orders...')
  
  try {
    const ordersCollection = mongoDb.collection('orders')
    const query = testLimit ? ordersCollection.find({}).limit(testLimit) : ordersCollection.find({})
    const orders = await query.toArray()
    
    colorLog(colors.cyan, `Found ${orders.length} orders to migrate`)
    const progress = createProgressTracker('Orders', orders.length)
    
    // Process orders in batches
    const orderBatches = chunkArray(orders, BATCH_SIZE)
    
    for (const batch of orderBatches) {
      try {
        // Prepare all order queries for this batch
        const orderQueries = []
        const batchOrderItems = []
        const batchOrderOffers = []
        
        for (const order of batch as any[]) {
          const userPgId = order.userId ? idMapping.users.get(order.userId.toString()) : null
          
          const orderQuery = sql`
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
              ${order.orderId || order._id.toString()},
              ${userPgId},
              ${parseFloat(order.amount || 0)},
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
          
          orderQueries.push(orderQuery)
          
          // Collect order items for batch insertion later
          if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
              batchOrderItems.push({
                mongoOrderId: order._id.toString(),
                item: item
              })
            }
          }
          
          // Collect order offers for batch insertion later
          if (order.offers && Array.isArray(order.offers)) {
            for (const offer of order.offers) {
              batchOrderOffers.push({
                mongoOrderId: order._id.toString(),
                orderId: order.orderId || order._id.toString(),
                offer: offer
              })
            }
          }
        }
        
        // Execute order batch insertion
        const orderResults = await sql.transaction(orderQueries)
        
        // Map MongoDB order IDs to PostgreSQL IDs
        for (let i = 0; i < batch.length; i++) {
          const order = (batch as any[])[i]
          const orderPgId = orderResults[i][0].id
          idMapping.orders.set(order._id.toString(), orderPgId)
          stats.orders.migrated++
        }
        
        // Batch insert order items if any
        if (batchOrderItems.length > 0) {
          const itemQueries = batchOrderItems.map(({ mongoOrderId, item }) => {
            const orderPgId = idMapping.orders.get(mongoOrderId)
            return sql`
              INSERT INTO order_items (
                order_id, variant_id, product_id, title, price, quantity,
                unit, size, created_at
              ) VALUES (
                ${orderPgId},
                ${item.variantId || ''},
                ${item.productId || null},
                ${item.title || ''},
                ${parseFloat(item.price || 0)},
                ${parseInt(item.quantity || 1)},
                ${item.unit || null},
                ${item.size ? parseFloat(item.size) : null},
                ${new Date()}
              )
            `
          })
          
          try {
            await sql.transaction(itemQueries)
            stats.orderItems.migrated += batchOrderItems.length
          } catch (error) {
            colorLog(colors.red, `❌ Error batch inserting order items: ${(error instanceof Error ? error.message : String(error))}`)
            
            // Fallback: insert items individually to identify problematic ones
            for (const { mongoOrderId, item } of batchOrderItems) {
              try {
                const orderPgId = idMapping.orders.get(mongoOrderId)
                await sql`
                  INSERT INTO order_items (
                    order_id, variant_id, product_id, title, price, quantity,
                    unit, size, created_at
                  ) VALUES (
                    ${orderPgId},
                    ${item.variantId || ''},
                    ${item.productId || null},
                    ${item.title || ''},
                    ${parseFloat(item.price || 0)},
                    ${parseInt(item.quantity || 1)},
                    ${item.unit || null},
                    ${item.size ? parseFloat(item.size) : null},
                    ${new Date()}
                  )
                `
                stats.orderItems.migrated++
              } catch (itemError) {
                logDetailedError('Order Item', mongoOrderId, itemError as Error, item)
                stats.orderItems.errors++
              }
            }
          }
        }
        
        // Batch insert order offers if any
        if (batchOrderOffers.length > 0) {
          const offerQueries = batchOrderOffers.map(({ mongoOrderId, orderId, offer }) => {
            const orderPgId = idMapping.orders.get(mongoOrderId)
            return sql`
              INSERT INTO order_offers (
                order_id, offer_id, title, discount, type, created_at
              ) VALUES (
                ${orderPgId},
                ${offer.offerId || ''},
                ${offer.title || offer.offerId || 'Unknown Offer'},
                ${parseFloat(offer.discount || 0)},
                ${offer.type || null},
                ${new Date()}
              )
            `
          })
          
          try {
            await sql.transaction(offerQueries)
            stats.orderOffers.migrated += batchOrderOffers.length
          } catch (error) {
            colorLog(colors.red, `❌ Error batch inserting order offers: ${(error instanceof Error ? error.message : String(error))}`)
            
            // Fallback: insert offers individually to identify problematic ones
            for (const { mongoOrderId, orderId, offer } of batchOrderOffers) {
              try {
                const orderPgId = idMapping.orders.get(mongoOrderId)
                await sql`
                  INSERT INTO order_offers (
                    order_id, offer_id, title, discount, type, created_at
                  ) VALUES (
                    ${orderPgId},
                    ${offer.offerId || ''},
                    ${offer.title || offer.offerId || 'Unknown Offer'},
                    ${parseFloat(offer.discount || 0)},
                    ${offer.type || null},
                    ${new Date()}
                  )
                `
                stats.orderOffers.migrated++
              } catch (offerError) {
                colorLog(colors.red, `❌ Order ${orderId} Offer: ${offerError instanceof Error ? offerError.message : String(offerError)}`)
                colorLog(colors.red, `   📄 Order ID: ${orderId}`)
                colorLog(colors.red, `   📄 Offer Details:`)
                colorLog(colors.red, `      - offerId: "${offer.offerId || ''}" (length: ${(offer.offerId || '').toString().length})`)
                colorLog(colors.red, `      - title: "${offer.title || offer.offerId || 'Unknown Offer'}" (length: ${(offer.title || offer.offerId || 'Unknown Offer').length})`)
                colorLog(colors.red, `      - discount: "${offer.discount || 0}" (raw: ${typeof offer.discount}, parsed: ${parseFloat(offer.discount || 0)})`)
                colorLog(colors.red, `      - type: "${offer.type || null}" (length: ${offer.type ? offer.type.length : 0})`)
                colorLog(colors.red, `   📄 Full offer object: ${JSON.stringify(offer, null, 2)}`)
                stats.orderOffers.errors++
              }
            }
          }
        }
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Error processing order batch: ${(error instanceof Error ? error.message : String(error))}`)
        
        // Fallback: process each order individually to identify the problematic one
        for (const order of batch as any[]) {
          try {
            const userPgId = order.userId ? idMapping.users.get(order.userId.toString()) : null
            
            const result = await sql`
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
                ${order.orderId || order._id.toString()},
                ${userPgId},
                ${parseFloat(order.amount || 0)},
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
            
            const orderPgId = result[0].id
            idMapping.orders.set(order._id.toString(), orderPgId)
            stats.orders.migrated++
            
            // Migrate order items individually for this order
            if (order.items && Array.isArray(order.items)) {
              for (const item of order.items) {
                try {
                  await sql`
                    INSERT INTO order_items (
                      order_id, variant_id, product_id, title, price, quantity,
                      unit, size, created_at
                    ) VALUES (
                      ${orderPgId},
                      ${item.variantId || ''},
                      ${item.productId || null},
                      ${item.title || ''},
                      ${parseFloat(item.price || 0)},
                      ${parseInt(item.quantity || 1)},
                      ${item.unit || null},
                      ${item.size ? parseFloat(item.size) : null},
                      ${new Date()}
                    )
                  `
                  stats.orderItems.migrated++
                } catch (itemError) {
                  logDetailedError('Order Item', order._id.toString(), itemError as Error, item)
                  stats.orderItems.errors++
                }
              }
            }
            
            // Migrate order offers individually for this order
            if (order.offers && Array.isArray(order.offers)) {
              for (const offer of order.offers) {
                try {
                  await sql`
                    INSERT INTO order_offers (
                      order_id, offer_id, title, discount, type, created_at
                    ) VALUES (
                      ${orderPgId},
                      ${offer.offerId || ''},
                      ${offer.title || offer.offerId || 'Unknown Offer'},
                      ${parseFloat(offer.discount || 0)},
                      ${offer.type || null},
                      ${new Date()}
                    )
                  `
                  stats.orderOffers.migrated++
                } catch (offerError) {
                  colorLog(colors.red, `❌ Order ${order.orderId || order._id} Offer: ${offerError instanceof Error ? offerError.message : String(offerError)}`)
                  colorLog(colors.red, `   📄 Order ID: ${order.orderId || order._id}`)
                  colorLog(colors.red, `   📄 Offer Details:`)
                  colorLog(colors.red, `      - offerId: "${offer.offerId || ''}" (length: ${(offer.offerId || '').toString().length})`)
                  colorLog(colors.red, `      - title: "${offer.title || offer.offerId || 'Unknown Offer'}" (length: ${(offer.title || offer.offerId || 'Unknown Offer').length})`)
                  colorLog(colors.red, `      - discount: "${offer.discount || 0}" (raw: ${typeof offer.discount}, parsed: ${parseFloat(offer.discount || 0)})`)
                  colorLog(colors.red, `      - type: "${offer.type || null}" (length: ${offer.type ? offer.type.length : 0})`)
                  colorLog(colors.red, `   📄 Full offer object: ${JSON.stringify(offer, null, 2)}`)
                  stats.orderOffers.errors++
                }
              }
            }
            
          } catch (individualError) {
            logDetailedError('Order', order._id.toString(), individualError as Error, order)
            stats.orders.errors++
          }
        }
      }
    }
    
    progress.finish()
    colorLog(colors.green, `✅ Orders migration completed: ${stats.orders.migrated} migrated, ${stats.orders.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in orders migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate reviews collection
async function migrateReviews(mongoDb: any) {
  colorLog(colors.blue, '⭐ Migrating reviews...')
  
  try {
    const reviewsCollection = mongoDb.collection('reviews')
    const query = testLimit ? reviewsCollection.find({}).limit(testLimit) : reviewsCollection.find({})
    const reviews = await query.toArray()
    
    colorLog(colors.cyan, `Found ${reviews.length} reviews to migrate`)
    const progress = createProgressTracker('Reviews', reviews.length)
    
    const reviewBatches = chunkArray(reviews, BATCH_SIZE)
    
    for (const batch of reviewBatches) {
      try {
        // Filter out reviews without valid products first
        const validReviews = batch.filter((review: any) => {
          const productPgId = idMapping.products.get(review.productId?.toString())
          if (!productPgId) {
            colorLog(colors.yellow, `⚠️ Skipping review ${review._id} - product not found`)
            return false
          }
          return true
        })
        
        if (validReviews.length === 0) {
          progress.update(batch.length)
          continue
        }
        
        const queries = validReviews.map((review: any) => {
          const productPgId = idMapping.products.get(review.productId?.toString())
          const userPgId = review.userId ? idMapping.users.get(review.userId.toString()) : null
          
          return sql`
            INSERT INTO reviews (
              review_id, product_id, user_id, author, rating, text,
              photos, is_approved, sort_order, created_at, updated_at
            ) VALUES (
              ${review.reviewId || review._id.toString()},
              ${productPgId},
              ${userPgId},
              ${review.author || 'Anonymous'},
              ${parseInt(review.rating || 5)},
              ${review.text || null},
              ${review.photos || []},
              ${review.isApproved || false},
              ${review.sortOrder || 0},
              ${review.createdAt ? new Date(review.createdAt) : new Date()},
              ${review.updatedAt ? new Date(review.updatedAt) : new Date()}
            ) RETURNING id
          `
        })
        
        const results = await sql.transaction(queries)
        stats.reviews.migrated += validReviews.length
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Error processing review batch: ${(error instanceof Error ? error.message : String(error))}`)
        
        // Fallback: process each review individually to identify the problematic one
        for (const review of batch as any[]) {
          try {
            const productPgId = idMapping.products.get(review.productId?.toString())
            const userPgId = review.userId ? idMapping.users.get(review.userId.toString()) : null
            
            if (!productPgId) {
              colorLog(colors.yellow, `⚠️ Skipping review ${review._id} - product not found`)
              continue
            }
            
            await sql`
              INSERT INTO reviews (
                review_id, product_id, user_id, author, rating, text,
                photos, is_approved, sort_order, created_at, updated_at
              ) VALUES (
                ${review.reviewId || review._id.toString()},
                ${productPgId},
                ${userPgId},
                ${review.author || 'Anonymous'},
                ${parseInt(review.rating || 5)},
                ${review.text || null},
                ${review.photos || []},
                ${review.isApproved || false},
                ${review.sortOrder || 0},
                ${review.createdAt ? new Date(review.createdAt) : new Date()},
                ${review.updatedAt ? new Date(review.updatedAt) : new Date()}
              ) RETURNING id
            `
            
            stats.reviews.migrated++
            
          } catch (individualError) {
            colorLog(colors.red, `❌ Review ${review._id}: ${individualError instanceof Error ? individualError.message : String(individualError)}`)
            colorLog(colors.red, `   📄 Review details: ${JSON.stringify(review, null, 2)}`)
            stats.reviews.errors++
          }
        }
      }
    }
    
    progress.finish()
    colorLog(colors.green, `✅ Reviews migration completed: ${stats.reviews.migrated} migrated, ${stats.reviews.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in reviews migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate rewards collection
async function migrateRewards(mongoDb: any) {
  colorLog(colors.blue, '🎖️ Migrating rewards...')
  
  try {
    const rewardsCollection = mongoDb.collection('rewards')
    const query = testLimit ? rewardsCollection.find({}).limit(testLimit) : rewardsCollection.find({})
    const rewards = await query.toArray()
    
    colorLog(colors.cyan, `Found ${rewards.length} rewards to migrate`)
    const progress = createProgressTracker('Rewards', rewards.length)
    
    const rewardBatches = chunkArray(rewards, BATCH_SIZE)
    
    for (const batch of rewardBatches) {
      try {
        // Filter out rewards without valid users first
        const validRewards = batch.filter((reward: any) => {
          const userPgId = idMapping.users.get(reward.userId?.toString())
          if (!userPgId) {
            colorLog(colors.yellow, `⚠️ Skipping reward ${reward._id} - user not found`)
            return false
          }
          return true
        })
        
        if (validRewards.length === 0) {
          progress.update(batch.length)
          continue
        }
        
        const queries = validRewards.map((reward: any) => {
          const userPgId = idMapping.users.get(reward.userId?.toString())
          
          return sql`
            INSERT INTO rewards (
              reward_id, user_id, reward_unit, reward_value, source_type,
              source_id, claim_type, claim_id, is_claimed,
              created_at, updated_at
            ) VALUES (
              ${reward.rewardId || reward._id.toString()},
              ${userPgId},
              ${reward.rewardUnit || null},
              ${reward.rewardValue ? parseFloat(reward.rewardValue) : null},
              ${reward.sourceType || null},
              ${reward.sourceId || null},
              ${reward.claimType || null},
              ${reward.claimId || null},
              ${reward.isClaimed || false},
              ${reward.createdAt ? new Date(reward.createdAt) : new Date()},
              ${reward.updatedAt ? new Date(reward.updatedAt) : new Date()}
            ) RETURNING id
          `
        })
        
        const results = await sql.transaction(queries)
        stats.rewards.migrated += validRewards.length
        
        progress.update(batch.length)
        
      } catch (error) {
        colorLog(colors.red, `❌ Error processing reward batch: ${(error instanceof Error ? error.message : String(error))}`)
        
        // Fallback: process each reward individually to identify the problematic one
        for (const reward of batch as any[]) {
          try {
            const userPgId = idMapping.users.get(reward.userId?.toString())
            if (!userPgId) {
              colorLog(colors.yellow, `⚠️ Skipping reward ${reward._id} - user not found`)
              continue
            }
            
            await sql`
              INSERT INTO rewards (
                reward_id, user_id, reward_unit, reward_value, source_type,
                source_id, claim_type, claim_id, is_claimed,
                created_at, updated_at
              ) VALUES (
                ${reward.rewardId || reward._id.toString()},
                ${userPgId},
                ${reward.rewardUnit || null},
                ${reward.rewardValue ? parseFloat(reward.rewardValue) : null},
                ${reward.sourceType || null},
                ${reward.sourceId || null},
                ${reward.claimType || null},
                ${reward.claimId || null},
                ${reward.isClaimed || false},
                ${reward.createdAt ? new Date(reward.createdAt) : new Date()},
                ${reward.updatedAt ? new Date(reward.updatedAt) : new Date()}
              ) RETURNING id
            `
            
            stats.rewards.migrated++
            
          } catch (individualError) {
            colorLog(colors.red, `❌ Reward ${reward._id}: ${individualError instanceof Error ? individualError.message : String(individualError)}`)
            colorLog(colors.red, `   📄 Reward details: ${JSON.stringify(reward, null, 2)}`)
            stats.rewards.errors++
          }
        }
      }
    }
    
    progress.finish()
    colorLog(colors.green, `✅ Rewards migration completed: ${stats.rewards.migrated} migrated, ${stats.rewards.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in rewards migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Migrate staff collection
async function migrateStaff(mongoDb: any) {
  colorLog(colors.blue, '👨‍💼 Migrating staff...')
  
  try {
    const staffCollection = mongoDb.collection('staffs')
    const query = testLimit ? staffCollection.find({}).limit(testLimit) : staffCollection.find({})
    const staffMembers = await query.toArray()
    
    colorLog(colors.cyan, `Found ${staffMembers.length} staff members to migrate`)
    const progress = createProgressTracker('Staff', staffMembers.length)
    let processedCount = 0
    
    for (const staff of staffMembers as any[]) {
      try {
        const result = await sql`
          INSERT INTO staff (
            staff_id, email, password_hash, full_name, role,
            permissions, is_active, last_login, created_at, updated_at
          ) VALUES (
            ${staff.staffId || staff._id.toString()},
            ${staff.email || ''},
            ${staff.passwordHash || null},
            ${staff.fullName || null},
            ${staff.role || null},
            ${JSON.stringify(staff.permissions || [])},
            ${staff.isActive !== false},
            ${staff.lastLogin ? new Date(staff.lastLogin) : null},
            ${staff.createdAt ? new Date(staff.createdAt) : new Date()},
            ${staff.updatedAt ? new Date(staff.updatedAt) : new Date()}
          ) RETURNING id
        `
        
        stats.staff.migrated++
        
      } catch (error) {
        colorLog(colors.red, `❌ Error migrating staff ${staff._id}: ${(error instanceof Error ? error.message : String(error))}`)
        stats.staff.errors++
      } finally {
        processedCount++
        if (processedCount % 5 === 0 || processedCount === staffMembers.length) {
          progress.update(5)
        }
      }
    }
    
    progress.finish()
    colorLog(colors.green, `✅ Staff migration completed: ${stats.staff.migrated} migrated, ${stats.staff.errors} errors`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Error in staff migration: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  }
}

// Print final statistics
function printStats() {
  colorLog(colors.bright, '\n📊 Migration Statistics:')
  colorLog(colors.bright, '========================')
  
  const totalMigrated = Object.values(stats).reduce((sum, stat) => sum + stat.migrated, 0)
  const totalErrors = Object.values(stats).reduce((sum, stat) => sum + stat.errors, 0)
  
  for (const [collection, stat] of Object.entries(stats)) {
    const color = stat.errors > 0 ? colors.yellow : colors.green
    colorLog(color, `${collection.padEnd(15)}: ${stat.migrated.toString().padStart(6)} migrated, ${stat.errors.toString().padStart(3)} errors`)
  }
  
  colorLog(colors.bright, '========================')
  colorLog(colors.bright, `Total              : ${totalMigrated.toString().padStart(6)} migrated, ${totalErrors.toString().padStart(3)} errors`)
  
  if (totalErrors === 0) {
    colorLog(colors.green, '\n🎉 Migration completed successfully!')
  } else {
    colorLog(colors.yellow, `\n⚠️  Migration completed with ${totalErrors} errors`)
  }
}

// Main migration function
async function migrate() {
  const startTime = Date.now()
  
  colorLog(colors.bright, '🚀 Starting MongoDB to PostgreSQL migration...')
  
  if (isTestRun) {
    colorLog(colors.yellow, `🧪 Running in TEST mode (limited to ${testLimit} records per collection)`)
  }
  
  if (isCleanRun) {
    colorLog(colors.yellow, '🧹 Running in CLEAN mode (will delete existing data)')
  }
  
  try {
    // Clean database if requested
    await cleanDatabase()
    
    // Connect to MongoDB
    await mongoClient.connect()
    const mongoDb = mongoClient.db()
    
    if (isParallel) {
      colorLog(colors.cyan, '⚡ Running in PARALLEL mode')
      
      // Group 1: Independent collections (can run in parallel)
      await Promise.all([
        migrateUsers(mongoDb),
        migrateProducts(mongoDb),
        migrateOffers(mongoDb),
        migrateStaff(mongoDb)
      ])
      
      // Group 2: Collections that depend on Group 1 (can run in parallel)
      await Promise.all([
        migrateAddresses(mongoDb),
        migrateVariants(mongoDb),
        migrateReviews(mongoDb)
      ])
      
      // Group 3: Orders (must run sequentially after users and products)
      await migrateOrders(mongoDb)
      
      // Group 4: Collections that depend on orders and users
      await migrateRewards(mongoDb)
      
    } else {
      // Run migrations in dependency order (sequential)
      await migrateUsers(mongoDb)
      await migrateAddresses(mongoDb)
      await migrateProducts(mongoDb)
      await migrateVariants(mongoDb)
      await migrateOffers(mongoDb)
      await migrateOrders(mongoDb)
      await migrateReviews(mongoDb)
      await migrateRewards(mongoDb)
      await migrateStaff(mongoDb)
    }
    
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    printStats()
    colorLog(colors.cyan, `\n⏱️  Migration completed in ${duration} seconds`)
    
  } catch (error) {
    colorLog(colors.red, `❌ Migration failed: ${(error instanceof Error ? error.message : String(error))}`)
    throw error
  } finally {
    await mongoClient.close()
  }
}

// Run the migration
migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))