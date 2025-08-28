# MongoDB to Neon PostgreSQL Migration Guide

This guide covers the complete migration process from MongoDB to Neon PostgreSQL using Drizzle ORM and the Neon serverless driver.

## 📋 Overview

### Migration Features
- **Safe Database Cleanup** - Complete database cleanup with safety checks
- **Snapshot Architecture** - Preserves historical data integrity for orders
- **ID Mapping** - Maintains relationships during migration
- **Comprehensive Verification** - Ensures data integrity post-migration
- **Type Safety** - Full TypeScript support with Drizzle ORM

### What Gets Migrated
- ✅ Users and authentication data
- ✅ Products and variants (master data)
- ✅ Orders with embedded snapshots (items, offers, addresses, UTM, Razorpay)
- ✅ Reviews and replies
- ✅ Rewards and loyalty data
- ✅ Staff accounts
- ✅ All relationships and foreign keys

## 🏗️ Architecture

### Key Design Decisions
1. **Snapshot Tables**: Order items and offers store point-in-time data (no FKs to master data)
2. **Embedded Data**: Order addresses, UTM params, and Razorpay data embedded in orders table
3. **ID Mapping**: MongoDB ObjectIds preserved as legacy references with new UUIDs as primary keys
4. **Analytical Views**: Pre-built views for dashboard analytics and reporting

### Database Schema
```
├── Core Tables
│   ├── users (with addresses, sessions)
│   └── staff (admin accounts)
├── Master Data
│   ├── products → product_variants
│   └── offers → user_offers (junction)
├── Order System (Snapshots)
│   ├── orders (with embedded address, UTM, razorpay)
│   ├── order_items (snapshot, no FKs)
│   └── order_offers (snapshot, no FKs)
├── Reviews & Ratings
│   ├── reviews → review_replies
└── Loyalty
    └── rewards
```

## 🔧 Setup

### 1. Dependencies
All required dependencies are already installed:
- `@neondatabase/serverless` - Neon serverless driver
- `drizzle-orm` - Type-safe ORM
- `drizzle-kit` - Migration tool
- `tsx` - TypeScript execution
- `@types/pg` - PostgreSQL types

### 2. Environment Variables
Add to your `.env`:
```env
# PostgreSQL (Neon)
DATABASE_URL=postgresql://[user]:[password]@[neon-hostname]/[dbname]?sslmode=require

# Safety flag for cleanup operations
ALLOW_DB_CLEANUP=true

# MongoDB (existing)
MONGODB_URI=mongodb+srv://...
```

### 3. Available Scripts
```bash
# Database Management
npm run db:cleanup          # Clean PostgreSQL database
npm run db:setup            # Create schema and views
npm run db:verify-empty     # Verify database is empty

# Migration
npm run migrate:all         # Migrate all data from MongoDB
npm run migrate:verify      # Verify migration results

# Combined Operations
npm run db:fresh            # Clean + setup + migrate (full reset)
```

## 🚀 Migration Process

### Step 1: Prepare Neon Database
1. Create a Neon account at https://neon.tech
2. Create a new database
3. Copy the connection string to `.env`
4. Add `ALLOW_DB_CLEANUP=true` for safety

### Step 2: Clean Setup (Recommended for first time)
```bash
# Check what would be cleaned (dry run)
npm run db:cleanup -- --dry-run

# Clean database (removes all existing data)
npm run db:cleanup -- --force

# Verify database is empty
npm run db:verify-empty

# Set up fresh schema
npm run db:setup
```

### Step 3: Migrate Data
```bash
# Migrate all data from MongoDB to PostgreSQL
npm run migrate:all

# Or combine cleanup + setup + migration
npm run migrate:all -- --clean
```

### Step 4: Verify Migration
```bash
# Run comprehensive verification
npm run migrate:verify
```

## 📊 Migration Scripts Details

### `cleanup-postgres.ts`
**Purpose**: Safely clean PostgreSQL database before migration

**Features**:
- Environment protection (production safety)
- Multiple confirmation steps
- Dry run mode to preview changes
- Force flag for automation
- Complete object removal (tables, views, sequences, types)

**Usage**:
```bash
npm run db:cleanup                    # Interactive cleanup
npm run db:cleanup -- --dry-run       # Preview what will be deleted
npm run db:cleanup -- --force         # Skip confirmations
```

**Safety Checks**:
- Requires `ALLOW_DB_CLEANUP=true` in environment
- Production environment protection
- User confirmation required (unless `--force`)
- Transaction-based cleanup (all or nothing)

### `setup-postgres.ts`
**Purpose**: Create database schema, views, and indexes

**Features**:
- Extension creation (pgcrypto for UUIDs)
- Drizzle migration execution
- Analytical views creation
- Setup verification

**Usage**:
```bash
npm run db:setup                      # Standard setup
npm run db:setup -- --force          # Continue even if tables exist
```

**What it creates**:
- All database tables with proper constraints
- Indexes for performance optimization
- Analytical views (order_summary, product_performance, etc.)
- Required extensions (pgcrypto)

### `migrate-data.ts`
**Purpose**: Migrate all data from MongoDB to PostgreSQL

**Features**:
- ID mapping preservation
- Batch processing with progress tracking
- Error handling and skip logic
- Relationship maintenance
- Snapshot data creation

**Usage**:
```bash
npm run migrate:all                   # Migrate to existing schema
npm run migrate:all -- --clean       # Clean + setup + migrate
```

**Migration Order**:
1. Users (foundation for FKs)
2. Addresses (depends on users)
3. Products (independent)
4. Product Variants (depends on products)
5. Offers (independent)
6. Orders + Items + Offers (snapshots)
7. Reviews + Replies (depends on products, users)
8. Rewards (depends on users)
9. Staff (independent)

### `verify-migration.ts`
**Purpose**: Comprehensive migration verification

**Features**:
- Count comparisons between databases
- Data integrity checks
- Foreign key relationship verification
- Performance testing
- Sample data comparison

**Usage**:
```bash
npm run migrate:verify
```

**Verification Steps**:
1. **Count Verification**: Compare record counts
2. **Relationship Checks**: Verify foreign keys work
3. **View Testing**: Test analytical views
4. **Performance Testing**: Run common queries
5. **Sample Comparison**: Compare actual data samples

## 🔍 Troubleshooting

### Common Issues

#### Connection Errors
```bash
❌ Database connection failed
```
**Solution**: Check `DATABASE_URL` format and network connectivity

#### Migration Errors
```bash
❌ Error migrating user xyz: duplicate key value
```
**Solution**: Run cleanup first or check for existing data conflicts

#### Count Mismatches
```bash
⚠️ MongoDB: 150, PostgreSQL: 148 ❌
```
**Solution**: Check migration logs for skipped records due to missing dependencies

### Debugging Tips

1. **Check Logs**: Migration scripts provide detailed progress logs
2. **Dry Run**: Use `--dry-run` to preview cleanup operations
3. **Incremental**: Run migration steps individually if needed
4. **Verification**: Always run verify script after migration

### Recovery

If migration fails:
```bash
# Clean and start over
npm run db:cleanup -- --force
npm run db:setup
npm run migrate:all

# Or use the combined command
npm run db:fresh
```

## 📈 Performance Considerations

### Optimizations Applied
- **Strategic Indexes**: Optimized for common query patterns
- **Analytical Views**: Pre-computed aggregations
- **Batch Processing**: Efficient data transfer
- **Connection Pooling**: Neon serverless handles automatically

### Expected Performance
- **Migration Speed**: ~1000 records/second (varies by data complexity)
- **Query Performance**: Significant improvement over MongoDB for analytical queries
- **Dashboard Loading**: Faster due to pre-built views and proper indexes

## 🔄 Rollback Strategy

### If You Need to Rollback
1. Keep MongoDB running during testing period
2. Use feature flags to switch between databases
3. Monitor application performance and errors
4. Gradually migrate traffic to PostgreSQL

### Dual-Write Period (Optional)
For critical applications, consider a dual-write period:
1. Write to both MongoDB and PostgreSQL
2. Read from MongoDB initially
3. Compare results between databases
4. Switch reads to PostgreSQL when confident
5. Stop dual writes and decommission MongoDB

## ✅ Post-Migration Checklist

### Immediate Steps
- [ ] Run `npm run migrate:verify` successfully
- [ ] Test critical API endpoints
- [ ] Verify dashboard loads correctly
- [ ] Check data integrity with sample queries

### Application Updates (When Ready)
- [ ] Update API routes to use PostgreSQL
- [ ] Switch environment variables
- [ ] Update caching strategies
- [ ] Monitor performance metrics

### Production Deployment
- [ ] Run migration on staging environment first
- [ ] Plan maintenance window for production
- [ ] Have rollback plan ready
- [ ] Monitor application after migration

## 🎯 Next Steps

1. **Test the Migration**: Run the complete process on a copy of your data
2. **Update Application**: Gradually migrate API endpoints to use PostgreSQL
3. **Performance Monitoring**: Set up monitoring for the new database
4. **Decommission MongoDB**: After successful migration and testing period

## 🆘 Support

### Migration Files Location
- **Scripts**: `scripts/` directory
- **Schema**: `src/db/schema.ts`
- **Configuration**: `drizzle.config.ts`
- **Documentation**: This file (`MIGRATION.md`)

### Useful Commands
```bash
# Check database connection
tsx -e "import { checkConnection } from './src/lib/db'; checkConnection().then(console.log)"

# Generate new migration (if schema changes)
npx drizzle-kit generate

# Apply migrations manually
npx drizzle-kit push
```

---

**⚠️ Important**: Always test the migration process on a non-production database first!

---

**Note**: All migration scripts now use `.env` file instead of `.env.local` for environment variables.