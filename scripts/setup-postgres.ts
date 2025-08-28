#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

console.log('🔧 PostgreSQL Database Setup Tool')
console.log('==================================')
console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Unknown'}`)
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
console.log('==================================\n')

async function checkConnection() {
  console.log('🔌 Testing database connection...')
  try {
    await sql`SELECT 1 as test`
    console.log('✅ Database connection established')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

async function checkExistingTables() {
  console.log('🔍 Checking for existing tables...')
  try {
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    if (tables.length > 0) {
      console.log('⚠️  Found existing tables:')
      tables.forEach((table: any) => {
        console.log(`   - ${table.tablename}`)
      })
      console.log('\n💡 Tip: Run cleanup script first if you want a fresh setup')
      return tables.length
    } else {
      console.log('✅ No existing tables found - ready for setup')
      return 0
    }
  } catch (error) {
    console.error('❌ Error checking existing tables:', error)
    return -1
  }
}

async function createExtensions() {
  console.log('🔧 Creating required extensions...')
  try {
    // Create pgcrypto extension for UUID generation
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`
    console.log('✅ Created pgcrypto extension')
  } catch (error) {
    console.error('❌ Error creating extensions:', error)
    throw error
  }
}

async function runDrizzleMigrations() {
  console.log('📋 Running database migrations...')
  try {
    // Check if migrations directory exists
    const migrationsPath = path.join(process.cwd(), 'drizzle')
    if (!fs.existsSync(migrationsPath)) {
      console.log('📝 Generating initial migration...')
      // Run drizzle-kit to generate migrations
      const { spawn } = require('child_process')
      const drizzleKit = spawn('npx', ['drizzle-kit', 'generate'], { stdio: 'inherit' })
      
      await new Promise((resolve, reject) => {
        drizzleKit.on('close', (code: number) => {
          if (code === 0) {
            resolve(code)
          } else {
            reject(new Error(`drizzle-kit generate failed with code ${code}`))
          }
        })
      })
    }

    // Find the migration file
    const files = fs.readdirSync(migrationsPath).filter(file => file.endsWith('.sql'))
    if (files.length === 0) {
      throw new Error('No migration files found')
    }
    
    const migrationFile = files[0] // Get the first migration file
    const migrationPath = path.join(migrationsPath, migrationFile)
    
    console.log(`📝 Running migration: ${migrationFile}`)
    
    // Read and execute the SQL migration file
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    // Split by --> statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    console.log(`📊 Executing ${statements.length} migration statements...`)
    
    for (const [index, statement] of statements.entries()) {
      try {
        await sql`${sql.unsafe(statement)}`
        console.log(`  ✅ Statement ${index + 1}/${statements.length} completed`)
      } catch (error) {
        console.error(`  ❌ Statement ${index + 1} failed:`, statement.substring(0, 100) + '...')
        throw error
      }
    }
    
    console.log('✅ Database migrations completed successfully')
  } catch (error) {
    console.error('❌ Error running migrations:', error)
    throw error
  }
}

async function createViews() {
  console.log('📊 Creating analytical views...')
  
  try {
    // Order summary view
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
    console.log('✅ Created order_summary view')

    // Product performance view
    await sql`
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
      GROUP BY oi.product_id, oi.variant_id, oi.title
    `
    console.log('✅ Created product_performance view')

    // Customer analytics view
    await sql`
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
      GROUP BY u.id
    `
    console.log('✅ Created customer_analytics view')

    // Campaign performance view
    await sql`
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
      ORDER BY revenue DESC NULLS LAST
    `
    console.log('✅ Created campaign_performance view')

  } catch (error) {
    console.error('❌ Error creating views:', error)
    throw error
  }
}

async function verifySetup() {
  console.log('🔍 Verifying database setup...')
  
  try {
    // Check tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    console.log(`✅ Created ${tables.length} tables:`)
    tables.forEach((table: any, index: number) => {
      console.log(`   ${index + 1}. ${table.tablename}`)
    })

    // Check views
    const views = await sql`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public'
      ORDER BY viewname
    `
    console.log(`✅ Created ${views.length} views:`)
    views.forEach((view: any, index: number) => {
      console.log(`   ${index + 1}. ${view.viewname}`)
    })

    // Check extensions
    const extensions = await sql`
      SELECT extname 
      FROM pg_extension 
      WHERE extname = 'pgcrypto'
    `
    if (extensions.length > 0) {
      console.log('✅ pgcrypto extension is installed')
    }

    // Test basic functionality
    console.log('\n🧪 Testing basic functionality...')
    
    // Test UUID generation
    const uuidTest = await sql`SELECT gen_random_uuid() as test_uuid`
    if (uuidTest.length > 0) {
      console.log('✅ UUID generation working')
    }

    // Test inserting a test record
    const testUserId = await sql`
      INSERT INTO users (user_id, phone_number, name)
      VALUES ('test-setup-user', '+1234567890', 'Setup Test User')
      RETURNING id
    `
    
    if (testUserId.length > 0) {
      console.log('✅ Test record insertion working')
      
      // Clean up test record
      await sql`DELETE FROM users WHERE user_id = 'test-setup-user'`
      console.log('✅ Test record cleanup completed')
    }

  } catch (error) {
    console.error('❌ Error verifying setup:', error)
    throw error
  }
}

async function generateMigrationFile() {
  console.log('📝 Generating Drizzle migration files...')
  try {
    const { spawn } = require('child_process')
    const drizzleGenerate = spawn('npx', ['drizzle-kit', 'generate'], { 
      stdio: 'pipe',
      cwd: process.cwd()
    })

    return new Promise((resolve, reject) => {
      let output = ''
      let errorOutput = ''

      drizzleGenerate.stdout.on('data', (data: Buffer) => {
        const text = data.toString()
        output += text
        // Show progress
        if (text.includes('generated')) {
          console.log(`  ${text.trim()}`)
        }
      })

      drizzleGenerate.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })

      drizzleGenerate.on('close', (code: number) => {
        if (code === 0) {
          console.log('✅ Migration files generated successfully')
          resolve(code)
        } else {
          console.error('❌ Failed to generate migration files')
          if (errorOutput) {
            console.error('Error output:', errorOutput)
          }
          reject(new Error(`drizzle-kit generate failed with code ${code}`))
        }
      })
    })
  } catch (error) {
    console.error('❌ Error generating migration files:', error)
    throw error
  }
}

async function main() {
  const startTime = Date.now()
  
  try {
    // 1. Check database connection
    const connected = await checkConnection()
    if (!connected) {
      process.exit(1)
    }

    // 2. Check for existing tables
    const existingTables = await checkExistingTables()
    
    // 3. Confirm if there are existing tables
    if (existingTables > 0) {
      console.log('\n⚠️  Warning: Existing tables found!')
      console.log('   This may cause conflicts or unexpected behavior.')
      console.log('   Consider running the cleanup script first:\n')
      console.log('   npm run db:cleanup -- --force\n')
      
      // Check if user wants to continue
      if (!process.argv.includes('--force')) {
        console.log('   Use --force flag to continue anyway')
        process.exit(1)
      } else {
        console.log('   Continuing with --force flag...\n')
      }
    }

    // 4. Create extensions
    await createExtensions()

    // 5. Generate migration files if they don't exist
    const migrationsPath = path.join(process.cwd(), 'drizzle')
    if (!fs.existsSync(migrationsPath) || fs.readdirSync(migrationsPath).length === 0) {
      await generateMigrationFile()
    } else {
      console.log('✅ Migration files already exist')
    }

    // 6. Run Drizzle migrations
    await runDrizzleMigrations()

    // 7. Create analytical views
    await createViews()

    // 8. Verify setup
    await verifySetup()

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('\n🎉 Database setup completed successfully!')
    console.log(`   Total time: ${duration} seconds`)
    console.log('\n📝 Next steps:')
    console.log('   1. Update your .env.local with DATABASE_URL')
    console.log('   2. Run the migration script to import data')
    console.log('   3. Update your API routes to use PostgreSQL')
    console.log('\n💡 Useful commands:')
    console.log('   npm run migrate:all     # Import data from MongoDB')
    console.log('   npm run migrate:verify  # Verify migration results')
    console.log('   npm run db:cleanup      # Clean database (if needed)')

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    console.log('\n🔧 Troubleshooting tips:')
    console.log('   1. Check your DATABASE_URL is correct')
    console.log('   2. Ensure your Neon database is accessible')
    console.log('   3. Verify you have the required permissions')
    console.log('   4. Check the error messages above for details')
    console.log('\n🧹 If needed, clean up and try again:')
    console.log('   npm run db:cleanup -- --force')
    process.exit(1)
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔧 PostgreSQL Database Setup Tool

Usage: tsx scripts/setup-postgres.ts [options]

Options:
  --force     Continue setup even if existing tables are found
  --help, -h  Show this help message

This script will:
  1. Test database connection
  2. Check for existing tables
  3. Create required extensions (pgcrypto)
  4. Generate Drizzle migration files
  5. Run database migrations
  6. Create analytical views
  7. Verify the setup

Environment Variables:
  DATABASE_URL  PostgreSQL connection string (required)

Examples:
  tsx scripts/setup-postgres.ts          # Interactive setup
  tsx scripts/setup-postgres.ts --force  # Skip existing table warnings

⚠️  For a completely fresh setup, run cleanup first:
   npm run db:cleanup -- --force
`)
  process.exit(0)
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n❌ Setup interrupted by user')
  process.exit(130)
})

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})