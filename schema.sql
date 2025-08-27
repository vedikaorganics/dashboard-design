-- =====================================================================================
-- PostgreSQL Schema for E-commerce Dashboard
-- Migration from MongoDB to Neon PostgreSQL
-- =====================================================================================
-- 
-- Design Principles:
-- 1. Separate snapshot tables for orders (no FKs to master data)
-- 2. Point-in-time accuracy for historical order data
-- 3. Master data tables for current state management
-- 4. Optimized for both OLTP and OLAP workloads
-- 5. Legacy MongoDB IDs preserved for backward compatibility
--
-- Key Features:
-- - UUID primary keys with legacy ID references
-- - Embedded 1-to-1 relationships (address, UTM, razorpay)
-- - Snapshot tables for order items and offers (no referential constraints)
-- - Strategic indexing for performance
-- - Analytical views for reporting
-- =====================================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================================
-- CORE TABLES: Users & Authentication
-- =====================================================================================

-- Users table - Customer accounts
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) UNIQUE NOT NULL, -- Legacy MongoDB userId for compatibility
  phone_number VARCHAR(20) NOT NULL,
  phone_number_verified BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  name VARCHAR(255),
  avatar TEXT,
  no_of_orders INTEGER DEFAULT 0, -- Denormalized for performance
  notes TEXT, -- Admin notes about customer
  last_ordered_on TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User indexes for performance
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_phone_verified ON users(phone_number_verified);

-- User saved addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_id VARCHAR(255) UNIQUE, -- Legacy MongoDB _id if needed
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  mobile_number VARCHAR(20),
  alternate_mobile_number VARCHAR(20),
  email VARCHAR(255),
  address_line1 TEXT,
  address_line2 TEXT,
  landmark VARCHAR(255),
  pincode VARCHAR(10),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  is_default BOOLEAN DEFAULT FALSE, -- One default address per user
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = TRUE;

-- User sessions for authentication
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE, -- Legacy MongoDB _id if needed
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- =====================================================================================
-- PRODUCT CATALOG: Master Data Tables
-- =====================================================================================
-- These tables store the current/active state of products and offers
-- They're used for catalog display and creating new orders

-- Products master table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) UNIQUE NOT NULL, -- Legacy MongoDB id
  title VARCHAR(255) NOT NULL,
  description TEXT,
  color_hex VARCHAR(7), -- Hex color code for theming
  bullet_points JSONB DEFAULT '[]', -- Array of product features
  main_variant VARCHAR(255), -- Primary variant ID
  sections JSONB DEFAULT '[]', -- Product page sections (images, text, etc.)
  badges TEXT[] DEFAULT '{}', -- Product badges (New, Sale, etc.)
  tags TEXT[] DEFAULT '{}', -- Searchable tags
  is_active BOOLEAN DEFAULT TRUE, -- Soft delete capability
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_title_search ON products USING GIN(to_tsvector('english', title));

-- Product variants master table
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id VARCHAR(255) UNIQUE NOT NULL, -- Legacy MongoDB id
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  unit VARCHAR(50), -- kg, grams, pieces, etc.
  size DECIMAL(10, 2), -- Numeric size value
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2), -- Maximum retail price
  cover_image TEXT, -- Primary product image URL
  cart_image TEXT, -- Image for cart display
  other_images TEXT[] DEFAULT '{}', -- Additional product images
  variant_order INTEGER DEFAULT 0, -- Display order
  label VARCHAR(100), -- Special labels (Best Seller, etc.)
  type VARCHAR(100), -- Variant type classification
  is_active BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0, -- Current inventory
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variants_variant_id ON product_variants(variant_id);
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_price ON product_variants(price);
CREATE INDEX idx_variants_is_active ON product_variants(is_active);
CREATE INDEX idx_variants_stock ON product_variants(stock_quantity) WHERE is_active = TRUE;

-- Offers master table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id VARCHAR(255) UNIQUE NOT NULL, -- Legacy MongoDB id
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount DECIMAL(5, 2) NOT NULL, -- Percentage or fixed amount
  is_user_offer BOOLEAN DEFAULT FALSE, -- Personalized vs. global offer
  trigger_price DECIMAL(10, 2), -- Minimum order value
  is_active BOOLEAN DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_offers_offer_id ON offers(offer_id);
CREATE INDEX idx_offers_is_active ON offers(is_active);
CREATE INDEX idx_offers_is_user_offer ON offers(is_user_offer);
CREATE INDEX idx_offers_validity ON offers(valid_from, valid_until) WHERE is_active = TRUE;

-- User-specific offer assignments (many-to-many)
CREATE TABLE user_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ, -- Override offer expiry for specific users
  UNIQUE(user_id, offer_id)
);

CREATE INDEX idx_user_offers_user_id ON user_offers(user_id);
CREATE INDEX idx_user_offers_offer_id ON user_offers(offer_id);
CREATE INDEX idx_user_offers_expires ON user_offers(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================================================
-- ORDER SYSTEM: Point-in-time Snapshots
-- =====================================================================================
-- Orders store embedded snapshots for historical accuracy
-- Related tables use NO foreign keys to master data (only reference IDs)

-- Main orders table with embedded 1-to-1 relationships
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id), -- Only FK to users table
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  order_status VARCHAR(20) CHECK (order_status IN ('CONFIRMED', 'PENDING', 'DELIVERED', 'CANCELLED')),
  payment_status VARCHAR(20) CHECK (payment_status IN ('PAID', 'PENDING', 'FAILED', 'CASH_ON_DELIVERY')),
  delivery_status VARCHAR(20) CHECK (delivery_status IN ('PENDING', 'PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
  time TIMESTAMPTZ, -- Order placement time
  cash_on_delivery BOOLEAN DEFAULT FALSE,
  rewards INTEGER DEFAULT 0, -- Reward points earned

  -- EMBEDDED ADDRESS SNAPSHOT (1-to-1)
  -- Stores delivery address at time of order
  address_first_name VARCHAR(100),
  address_last_name VARCHAR(100),
  address_mobile_number VARCHAR(20),
  address_alternate_mobile_number VARCHAR(20),
  address_email VARCHAR(255),
  address_line1 TEXT,
  address_line2 TEXT,
  address_landmark VARCHAR(255),
  address_pincode VARCHAR(10),
  address_city VARCHAR(100),
  address_state VARCHAR(100),
  address_country VARCHAR(100),

  -- EMBEDDED UTM PARAMS SNAPSHOT (1-to-1)
  -- Stores campaign tracking data at time of order
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),

  -- EMBEDDED RAZORPAY ORDER SNAPSHOT (1-to-1)
  -- Stores payment gateway data
  razorpay_order_id VARCHAR(255),
  razorpay_receipt VARCHAR(255),
  razorpay_status VARCHAR(50),
  razorpay_payments JSONB DEFAULT '[]', -- Payment attempts and details

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Order indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status_combo ON orders(order_status, payment_status, delivery_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_utm_campaign ON orders(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX idx_orders_razorpay_order_id ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX idx_orders_pincode ON orders(address_pincode) WHERE address_pincode IS NOT NULL;

-- Order items snapshot table (NO FK to product_variants)
-- Stores product data as it existed at time of order
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- SNAPSHOT DATA - No foreign keys to master tables
  variant_id VARCHAR(255) NOT NULL, -- Reference only, not FK
  product_id VARCHAR(255), -- Reference only, not FK
  title VARCHAR(255) NOT NULL, -- Product title at purchase time
  price DECIMAL(10, 2) NOT NULL, -- Price at purchase time
  quantity INTEGER NOT NULL,

  -- Additional snapshot fields for complete historical record
  unit VARCHAR(50), -- Unit of measurement at purchase time
  size DECIMAL(10, 2), -- Size at purchase time
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Order offers snapshot table (NO FK to offers)
-- Stores offer data as it existed at time of order
CREATE TABLE order_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  -- SNAPSHOT DATA - No foreign keys to master tables
  offer_id VARCHAR(255) NOT NULL, -- Reference only, not FK
  title VARCHAR(255) NOT NULL, -- Offer title at use time
  discount DECIMAL(5, 2) NOT NULL, -- Discount amount at use time
  type VARCHAR(50), -- Discount type (percentage, fixed, etc.)

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_offers_order_id ON order_offers(order_id);
CREATE INDEX idx_order_offers_offer_id ON order_offers(offer_id);

-- =====================================================================================
-- REVIEWS & RATINGS SYSTEM
-- =====================================================================================

-- Product reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id VARCHAR(255) UNIQUE, -- Legacy MongoDB _id if needed
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Preserve review if user deleted
  author VARCHAR(255) NOT NULL, -- Display name for review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  photos TEXT[] DEFAULT '{}', -- Review image URLs
  is_approved BOOLEAN DEFAULT FALSE, -- Moderation flag
  sort_order INTEGER DEFAULT 0, -- Manual ordering for featured reviews
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Review replies (admin responses to reviews)
CREATE TABLE review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author VARCHAR(255), -- Staff member or user name
  text TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT FALSE, -- Distinguish staff vs customer replies
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX idx_review_replies_created_at ON review_replies(created_at);

-- =====================================================================================
-- REWARDS & LOYALTY SYSTEM
-- =====================================================================================

-- Customer reward points and transactions
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id VARCHAR(255) UNIQUE, -- Legacy MongoDB _id if needed
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_unit VARCHAR(50), -- Points, cashback, etc.
  reward_value DECIMAL(10, 2), -- Numeric value
  source_type VARCHAR(50), -- order, referral, signup, etc.
  source_id VARCHAR(255), -- ID of source record (order_id, etc.)
  claim_type VARCHAR(50), -- How rewards can be claimed
  claim_id VARCHAR(255), -- Reference to claim transaction
  is_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_is_claimed ON rewards(is_claimed);
CREATE INDEX idx_rewards_source_type ON rewards(source_type);
CREATE INDEX idx_rewards_source_id ON rewards(source_id);

-- =====================================================================================
-- STAFF & ADMINISTRATION
-- =====================================================================================

-- Admin/staff user accounts
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR(255) UNIQUE, -- Legacy MongoDB _id if needed
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Hashed password if storing locally
  full_name VARCHAR(255),
  role VARCHAR(50), -- admin, manager, support, etc.
  permissions JSONB DEFAULT '[]', -- Array of permission strings
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_staff_is_active ON staff(is_active);
CREATE INDEX idx_staff_role ON staff(role);

-- =====================================================================================
-- ANALYTICAL VIEWS
-- =====================================================================================
-- Pre-computed views for dashboard analytics and reporting

-- Order summary with aggregated data
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
GROUP BY o.id, u.name, u.phone_number, u.email;

-- Product performance analytics
CREATE VIEW product_performance AS
SELECT 
  oi.product_id,
  oi.variant_id,
  oi.title,
  -- Sales metrics
  COUNT(DISTINCT oi.order_id) as order_count,
  SUM(oi.quantity) as total_sold,
  SUM(oi.price * oi.quantity) as total_revenue,
  AVG(oi.price) as avg_selling_price,
  -- Time-based metrics
  MIN(o.created_at) as first_sale,
  MAX(o.created_at) as last_sale,
  -- Only confirmed and paid orders
  COUNT(DISTINCT oi.order_id) FILTER (
    WHERE o.payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as confirmed_orders,
  SUM(oi.quantity) FILTER (
    WHERE o.payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as confirmed_quantity,
  SUM(oi.price * oi.quantity) FILTER (
    WHERE o.payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as confirmed_revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
GROUP BY oi.product_id, oi.variant_id, oi.title;

-- Customer analytics
CREATE VIEW customer_analytics AS
SELECT 
  u.id,
  u.user_id,
  u.name,
  u.phone_number,
  u.email,
  u.created_at as signup_date,
  -- Order statistics
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.id) FILTER (
    WHERE o.payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as confirmed_orders,
  SUM(o.amount) FILTER (
    WHERE o.payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as total_spent,
  AVG(o.amount) FILTER (
    WHERE o.payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as avg_order_value,
  -- Timing analytics
  MIN(o.created_at) as first_order,
  MAX(o.created_at) as last_order,
  -- Reward statistics
  COALESCE(SUM(r.reward_value) FILTER (WHERE r.is_claimed = false), 0) as unclaimed_rewards
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
LEFT JOIN rewards r ON r.user_id = u.id
GROUP BY u.id;

-- Campaign performance (UTM analysis)
CREATE VIEW campaign_performance AS
SELECT 
  COALESCE(utm_campaign, 'Direct') as campaign,
  COALESCE(utm_source, 'Direct') as source,
  COALESCE(utm_medium, 'Direct') as medium,
  -- Order metrics
  COUNT(*) as total_orders,
  COUNT(*) FILTER (
    WHERE payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as confirmed_orders,
  SUM(amount) FILTER (
    WHERE payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as revenue,
  AVG(amount) FILTER (
    WHERE payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  ) as avg_order_value,
  -- Conversion rate
  (COUNT(*) FILTER (WHERE payment_status IN ('PAID', 'CASH_ON_DELIVERY'))::DECIMAL / COUNT(*) * 100) as conversion_rate,
  -- Time range
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
GROUP BY utm_campaign, utm_source, utm_medium
HAVING COUNT(*) > 0
ORDER BY revenue DESC NULLS LAST;

-- =====================================================================================
-- SAMPLE QUERIES FOR COMMON OPERATIONS
-- =====================================================================================

/* 
-- Get complete order with all details
SELECT 
  o.*,
  json_agg(DISTINCT jsonb_build_object(
    'id', oi.id,
    'variant_id', oi.variant_id,
    'title', oi.title,
    'price', oi.price,
    'quantity', oi.quantity
  )) FILTER (WHERE oi.id IS NOT NULL) as items,
  json_agg(DISTINCT jsonb_build_object(
    'id', oo.id,
    'offer_id', oo.offer_id,
    'title', oo.title,
    'discount', oo.discount,
    'type', oo.type
  )) FILTER (WHERE oo.id IS NOT NULL) as offers
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN order_offers oo ON oo.order_id = o.id
WHERE o.order_id = 'ORD123'
GROUP BY o.id;

-- Analytics: Top selling products last 30 days
SELECT 
  oi.product_id,
  oi.title,
  COUNT(DISTINCT oi.order_id) as times_ordered,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.price * oi.quantity) as revenue
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
  AND o.payment_status IN ('PAID', 'CASH_ON_DELIVERY')
GROUP BY oi.product_id, oi.title
ORDER BY revenue DESC
LIMIT 10;

-- Customer order history with details
SELECT 
  o.order_id,
  o.amount,
  o.order_status,
  o.payment_status,
  o.created_at,
  COUNT(oi.id) as item_count,
  string_agg(oi.title, ', ') as items
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN users u ON u.id = o.user_id
WHERE u.user_id = 'USER123'
GROUP BY o.id
ORDER BY o.created_at DESC;

-- Campaign ROI analysis
SELECT 
  utm_campaign,
  COUNT(*) as total_orders,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_order_value,
  COUNT(DISTINCT user_id) as unique_customers
FROM orders
WHERE utm_campaign IS NOT NULL
  AND payment_status IN ('PAID', 'CASH_ON_DELIVERY')
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY utm_campaign
ORDER BY total_revenue DESC;
*/

-- =====================================================================================
-- END OF SCHEMA
-- =====================================================================================