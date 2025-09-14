#!/usr/bin/env tsx

/**
 * Author Migration Script
 * 
 * This script migrates existing blog authors from the blogAuthor field
 * to the new author profiles system using authorSlug references.
 * 
 * Usage:
 *   npm run migrate-authors        # Run migration
 *   npm run migrate-authors status # Check migration status
 *   npm run migrate-authors rollback # Rollback migration (WARNING: destructive)
 */

import { migrateBlogAuthors, rollbackMigration, getMigrationStatus } from '../src/lib/authors/migration'

async function main() {
  const command = process.argv[2] || 'migrate'
  
  console.log('🚀 Author Migration Script')
  console.log('==========================')
  
  switch (command) {
    case 'status':
    case 'check':
      console.log('📊 Checking migration status...\n')
      
      const status = await getMigrationStatus()
      
      if (status.error) {
        console.error('❌ Failed to check migration status:', status.error)
        process.exit(1)
      }
      
      console.log('Migration Status:')
      console.log(`  - Migration authors: ${status.migrationAuthorsCount}`)
      console.log(`  - Posts with authorSlug: ${status.postsWithAuthorSlug}`)
      console.log(`  - Posts with blogAuthor: ${status.postsWithBlogAuthor}`)
      console.log(`  - Migration completed: ${status.migrationCompleted ? '✅' : '❌'}`)
      console.log(`  - Needs migration: ${status.needsMigration ? '⚠️  Yes' : '✅ No'}`)
      
      if (status.needsMigration) {
        console.log('\n💡 Run "npm run migrate-authors" to migrate blog authors')
      } else if (status.migrationCompleted) {
        console.log('\n✅ Migration already completed')
      }
      break
      
    case 'rollback':
    case 'revert':
      console.log('⚠️  Rolling back migration...')
      console.log('WARNING: This will delete all migrated author profiles!\n')
      
      // Add confirmation in production
      if (process.env.NODE_ENV === 'production') {
        console.log('❌ Rollback is disabled in production for safety')
        process.exit(1)
      }
      
      const rollbackResult = await rollbackMigration()
      
      if (rollbackResult.success) {
        console.log('\n✅ Rollback completed successfully!')
      } else {
        console.log('\n❌ Rollback completed with errors:')
        rollbackResult.errors.forEach(error => {
          console.log(`   - ${error}`)
        })
        process.exit(1)
      }
      break
      
    case 'migrate':
    case 'run':
      console.log('📚 Migrating blog authors to author profiles system...\n')
      
      // Check if migration is needed first
      const preStatus = await getMigrationStatus()
      
      if (preStatus.migrationCompleted) {
        console.log('✅ Migration already completed. Use "status" command to check details.')
        process.exit(0)
      }
      
      if (!preStatus.needsMigration) {
        console.log('ℹ️  No migration needed. No blog posts with legacy author data found.')
        process.exit(0)
      }
      
      const result = await migrateBlogAuthors()
      
      console.log('\n📋 Migration Results:')
      console.log('====================')
      console.log(`Status: ${result.success ? '✅ Success' : '❌ Failed'}`)
      console.log(`Authors created: ${result.authorsCreated}`)
      console.log(`Posts updated: ${result.postsUpdated}`)
      console.log(`Errors: ${result.errors.length}`)
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors encountered:')
        result.errors.forEach(error => {
          console.log(`   - ${error}`)
        })
      }
      
      if (Object.keys(result.authorsMapping).length > 0) {
        console.log('\n📋 Author Mapping:')
        Object.entries(result.authorsMapping).forEach(([oldName, newSlug]) => {
          console.log(`   "${oldName}" -> ${newSlug}`)
        })
      }
      
      if (result.success) {
        console.log('\n🎉 Migration completed successfully!')
        console.log('\nNext steps:')
        console.log('1. Verify the migration results in the CMS')
        console.log('2. Test the author profiles functionality')
        console.log('3. Update any hardcoded author references in your code')
        console.log('4. Consider removing the deprecated blogAuthor field after thorough testing')
      } else {
        console.log('\n💥 Migration failed. Please review the errors above.')
        process.exit(1)
      }
      break
      
    default:
      console.log('❌ Unknown command:', command)
      console.log('\nUsage:')
      console.log('  npm run migrate-authors          # Run migration')
      console.log('  npm run migrate-authors status   # Check migration status')
      console.log('  npm run migrate-authors rollback # Rollback migration')
      process.exit(1)
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  process.exit(1)
})

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})