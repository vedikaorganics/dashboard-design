import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  jsonb,
  inet,
  check,
  unique,
  index,
  primaryKey
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// =====================================================================================
// CORE TABLES: Users & Authentication
// =====================================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).unique().notNull(), // Legacy MongoDB userId
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
  phoneNumberVerified: boolean('phone_number_verified').default(false),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  avatar: text('avatar'),
  offers: text('offers').array().default(sql`'{}'`),
  noOfOrders: integer('no_of_orders').default(0),
  notes: text('notes'),
  lastOrderedOn: timestamp('last_ordered_on', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  phoneNumberIdx: index('idx_users_phone_number').on(table.phoneNumber),
  emailIdx: index('idx_users_email').on(table.email),
  userIdIdx: index('idx_users_user_id').on(table.userId),
  phoneVerifiedIdx: index('idx_users_phone_verified').on(table.phoneNumberVerified),
  // Performance-critical index for ORDER BY created_at DESC queries
  createdAtIdx: index('idx_users_created_at').on(table.createdAt.desc()),
  // Composite index for common query patterns (created_at + phone_verified filters)
  createdAtFiltersIdx: index('idx_users_created_at_filters').on(table.createdAt.desc(), table.phoneNumberVerified)
}))

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  addressId: varchar('address_id', { length: 255 }).unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  mobileNumber: varchar('mobile_number', { length: 20 }),
  alternateMobileNumber: varchar('alternate_mobile_number', { length: 20 }),
  email: varchar('email', { length: 255 }),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  landmark: varchar('landmark', { length: 255 }),
  pincode: varchar('pincode', { length: 10 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  userIdIdx: index('idx_addresses_user_id').on(table.userId),
  defaultIdx: index('idx_addresses_default').on(table.userId, table.isDefault)
}))

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).unique().notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  tokenIdx: index('idx_sessions_token').on(table.token),
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt)
}))

// =====================================================================================
// PRODUCT CATALOG: Master Data Tables
// =====================================================================================

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: varchar('product_id', { length: 255 }).unique().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  colorHex: varchar('color_hex', { length: 7 }),
  bulletPoints: jsonb('bullet_points').default('[]'),
  mainVariant: varchar('main_variant', { length: 255 }),
  sections: jsonb('sections').default('[]'),
  badges: text('badges').array().default(sql`'{}'`),
  tags: text('tags').array().default(sql`'{}'`),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  productIdIdx: index('idx_products_product_id').on(table.productId),
  tagsIdx: index('idx_products_tags').using('gin', table.tags),
  isActiveIdx: index('idx_products_is_active').on(table.isActive)
}))

export const productVariants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: varchar('variant_id', { length: 255 }).unique().notNull(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  size: decimal('size', { precision: 10, scale: 2 }),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  mrp: decimal('mrp', { precision: 10, scale: 2 }),
  coverImage: text('cover_image'),
  cartImage: text('cart_image'),
  otherImages: text('other_images').array().default(sql`'{}'`),
  variantOrder: integer('variant_order').default(0),
  label: varchar('label', { length: 100 }),
  type: varchar('type', { length: 100 }),
  isActive: boolean('is_active').default(true),
  stockQuantity: integer('stock_quantity').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  variantIdIdx: index('idx_variants_variant_id').on(table.variantId),
  productIdIdx: index('idx_variants_product_id').on(table.productId),
  priceIdx: index('idx_variants_price').on(table.price),
  isActiveIdx: index('idx_variants_is_active').on(table.isActive),
  stockIdx: index('idx_variants_stock').on(table.stockQuantity)
}))

export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: varchar('offer_id', { length: 255 }).unique().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  discount: decimal('discount', { precision: 7, scale: 2 }).notNull(),
  isUserOffer: boolean('is_user_offer').default(false),
  triggerPrice: decimal('trigger_price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  offerIdIdx: index('idx_offers_offer_id').on(table.offerId),
  isActiveIdx: index('idx_offers_is_active').on(table.isActive),
  isUserOfferIdx: index('idx_offers_is_user_offer').on(table.isUserOffer),
  validityIdx: index('idx_offers_validity').on(table.validFrom, table.validUntil)
}))


// =====================================================================================
// ORDER SYSTEM: Point-in-time Snapshots
// =====================================================================================

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: varchar('order_id', { length: 255 }).unique().notNull(),
  userId: uuid('user_id').references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR'),
  orderStatus: varchar('order_status', { length: 20 }),
  paymentStatus: varchar('payment_status', { length: 20 }),
  deliveryStatus: varchar('delivery_status', { length: 20 }),
  time: timestamp('time', { withTimezone: true }),
  cashOnDelivery: boolean('cash_on_delivery').default(false),
  rewards: integer('rewards').default(0),
  
  // Address snapshot (1-to-1, embedded)
  addressFirstName: varchar('address_first_name', { length: 100 }),
  addressLastName: varchar('address_last_name', { length: 100 }),
  addressMobileNumber: varchar('address_mobile_number', { length: 20 }),
  addressAlternateMobileNumber: varchar('address_alternate_mobile_number', { length: 20 }),
  addressEmail: varchar('address_email', { length: 255 }),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  addressLandmark: varchar('address_landmark', { length: 255 }),
  addressPincode: varchar('address_pincode', { length: 10 }),
  addressCity: varchar('address_city', { length: 100 }),
  addressState: varchar('address_state', { length: 100 }),
  addressCountry: varchar('address_country', { length: 100 }),
  
  // UTM params (1-to-1, embedded)
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  
  // Razorpay order info (1-to-1, embedded)
  razorpayOrderId: varchar('razorpay_order_id', { length: 255 }),
  razorpayReceipt: varchar('razorpay_receipt', { length: 255 }),
  razorpayStatus: varchar('razorpay_status', { length: 50 }),
  razorpayPayments: jsonb('razorpay_payments').default('[]'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  userIdIdx: index('idx_orders_user_id').on(table.userId),
  orderIdIdx: index('idx_orders_order_id').on(table.orderId),
  statusComboIdx: index('idx_orders_status_combo').on(table.orderStatus, table.paymentStatus, table.deliveryStatus),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
  paymentStatusIdx: index('idx_orders_payment_status').on(table.paymentStatus),
  utmCampaignIdx: index('idx_orders_utm_campaign').on(table.utmCampaign),
  razorpayOrderIdIdx: index('idx_orders_razorpay_order_id').on(table.razorpayOrderId),
  pincodeIdx: index('idx_orders_pincode').on(table.addressPincode),
  
  // Add check constraints
  orderStatusCheck: check('order_status_check', sql`${table.orderStatus} IN ('CREATED', 'CONFIRMED', 'PENDING', 'DELIVERED', 'CANCELLED')`),
  paymentStatusCheck: check('payment_status_check', sql`${table.paymentStatus} IN ('CREATED', 'ATTEMPTED', 'PAID', 'PENDING', 'FAILED', 'CASH_ON_DELIVERY')`),
  deliveryStatusCheck: check('delivery_status_check', sql`${table.deliveryStatus} IN ('PENDING', 'PREPARING', 'PREPARING_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED')`)
}))

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  
  // Snapshot data (no FKs to product_variants)
  variantId: varchar('variant_id', { length: 255 }).notNull(),
  productId: varchar('product_id', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  
  // Additional snapshot fields
  unit: varchar('unit', { length: 50 }),
  size: decimal('size', { precision: 10, scale: 2 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
  variantIdIdx: index('idx_order_items_variant_id').on(table.variantId),
  productIdIdx: index('idx_order_items_product_id').on(table.productId)
}))

export const orderOffers = pgTable('order_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  
  // Snapshot data (no FKs to offers)
  offerId: varchar('offer_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  discount: decimal('discount', { precision: 7, scale: 2 }).notNull(),
  type: varchar('type', { length: 50 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  orderIdIdx: index('idx_order_offers_order_id').on(table.orderId),
  offerIdIdx: index('idx_order_offers_offer_id').on(table.offerId)
}))

// =====================================================================================
// REVIEWS & RATINGS SYSTEM
// =====================================================================================

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: varchar('review_id', { length: 255 }).unique(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  author: varchar('author', { length: 255 }).notNull(),
  rating: integer('rating').notNull(),
  text: text('text'),
  photos: text('photos').array().default(sql`'{}'`),
  isApproved: boolean('is_approved').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  productIdIdx: index('idx_reviews_product_id').on(table.productId),
  userIdIdx: index('idx_reviews_user_id').on(table.userId),
  isApprovedIdx: index('idx_reviews_is_approved').on(table.isApproved),
  ratingIdx: index('idx_reviews_rating').on(table.rating),
  createdAtIdx: index('idx_reviews_created_at').on(table.createdAt),
  
  ratingCheck: check('rating_check', sql`${table.rating} >= 1 AND ${table.rating} <= 5`)
}))

export const reviewReplies = pgTable('review_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewId: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  author: varchar('author', { length: 255 }),
  text: text('text').notNull(),
  isStaffReply: boolean('is_staff_reply').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  reviewIdIdx: index('idx_review_replies_review_id').on(table.reviewId),
  createdAtIdx: index('idx_review_replies_created_at').on(table.createdAt)
}))

// =====================================================================================
// REWARDS & LOYALTY SYSTEM
// =====================================================================================

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  rewardId: varchar('reward_id', { length: 255 }).unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardUnit: varchar('reward_unit', { length: 50 }),
  rewardValue: decimal('reward_value', { precision: 10, scale: 2 }),
  sourceType: varchar('source_type', { length: 50 }),
  sourceId: varchar('source_id', { length: 255 }),
  claimType: varchar('claim_type', { length: 50 }),
  claimId: varchar('claim_id', { length: 255 }),
  isClaimed: boolean('is_claimed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  userIdIdx: index('idx_rewards_user_id').on(table.userId),
  isClaimedIdx: index('idx_rewards_is_claimed').on(table.isClaimed),
  sourceTypeIdx: index('idx_rewards_source_type').on(table.sourceType),
  sourceIdIdx: index('idx_rewards_source_id').on(table.sourceId)
}))

// =====================================================================================
// STAFF & ADMINISTRATION
// =====================================================================================

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: varchar('staff_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  fullName: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 50 }),
  permissions: jsonb('permissions').default('[]'),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  emailIdx: index('idx_staff_email').on(table.email),
  isActiveIdx: index('idx_staff_is_active').on(table.isActive),
  roleIdx: index('idx_staff_role').on(table.role)
}))

// =====================================================================================
// RELATIONS
// =====================================================================================

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  sessions: many(sessions),
  orders: many(orders),
  reviews: many(reviews),
  rewards: many(rewards)
}))

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id]
  })
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}))

export const productsRelations = relations(products, ({ many }) => ({
  variants: many(productVariants),
  reviews: many(reviews)
}))

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id]
  })
}))



export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id]
  }),
  items: many(orderItems),
  offers: many(orderOffers)
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  })
}))

export const orderOffersRelations = relations(orderOffers, ({ one }) => ({
  order: one(orders, {
    fields: [orderOffers.orderId],
    references: [orders.id]
  })
}))

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id]
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id]
  }),
  replies: many(reviewReplies)
}))

export const reviewRepliesRelations = relations(reviewReplies, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewReplies.reviewId],
    references: [reviews.id]
  }),
  user: one(users, {
    fields: [reviewReplies.userId],
    references: [users.id]
  })
}))

export const rewardsRelations = relations(rewards, ({ one }) => ({
  user: one(users, {
    fields: [rewards.userId],
    references: [users.id]
  })
}))