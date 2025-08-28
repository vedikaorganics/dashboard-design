#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless'
import * as readline from 'readline'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

if (!process.env.ALLOW_DB_CLEANUP) {
  console.error('❌ ALLOW_DB_CLEANUP must be set to true in .env.local for safety')
  process.exit(1)
}

// Check if we're in production
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--allow-production')) {
  console.error('❌ Cannot run cleanup in production environment')
  console.error('   Use --allow-production flag if you really need to')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

// Check for force flag
const isForced = process.argv.includes('--force')
const isDryRun = process.argv.includes('--dry-run')

console.log('🧹 PostgreSQL Database Cleanup Tool')
console.log('=====================================')
console.log(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Unknown'}`)
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'CLEANUP'}`)
console.log('=====================================\n')

async function getTablesAndViews() {
  console.log('📋 Analyzing database structure...')
  
  try {
    // Get all tables
    const tables = await sql`
      SELECT tablename as name, 'table' as type 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    // Get all views
    const views = await sql`
      SELECT viewname as name, 'view' as type 
      FROM pg_views 
      WHERE schemaname = 'public'
      ORDER BY viewname
    `

    // Get all sequences
    const sequences = await sql`
      SELECT sequencename as name, 'sequence' as type 
      FROM pg_sequences 
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `

    // Get all custom types
    const types = await sql`
      SELECT typname as name, 'type' as type 
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' 
      AND t.typtype = 'c'
      ORDER BY typname
    `

    return {
      tables: tables as Array<{name: string, type: string}>,
      views: views as Array<{name: string, type: string}>,
      sequences: sequences as Array<{name: string, type: string}>,
      types: types as Array<{name: string, type: string}>
    }
  } catch (error) {
    console.error('❌ Error analyzing database:', error)
    process.exit(1)
  }
}

async function getDataCounts() {
  console.log('📊 Getting data counts...')
  
  const structure = await getTablesAndViews()
  const counts: Record<string, number> = {}

  for (const table of structure.tables) {
    try {
      const result = await sql`SELECT COUNT(*) as count FROM ${sql.unsafe(table.name)}`
      counts[table.name] = parseInt((result[0] as any).count)
    } catch (error) {
      counts[table.name] = -1 // Error getting count
    }
  }

  return counts
}

async function confirmCleanup() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise<boolean>((resolve) => {
    rl.question('\n⚠️  Type "DELETE ALL DATA" to confirm cleanup: ', (answer) => {
      rl.close()
      resolve(answer === 'DELETE ALL DATA')
    })
  })
}

async function dropAllObjects() {
  console.log('\n🗑️  Starting cleanup process...')

  const structure = await getTablesAndViews()
  const totalObjects = structure.tables.length + structure.views.length + 
                      structure.sequences.length + structure.types.length

  if (totalObjects === 0) {
    console.log('✅ Database is already empty!')
    return
  }

  console.log(`\nFound ${totalObjects} objects to remove:`)
  console.log(`- ${structure.tables.length} tables`)
  console.log(`- ${structure.views.length} views`)
  console.log(`- ${structure.sequences.length} sequences`)
  console.log(`- ${structure.types.length} custom types`)

  if (isDryRun) {
    console.log('\n🔍 DRY RUN - Objects that would be dropped:')
    
    if (structure.views.length > 0) {
      console.log('\nViews:')
      structure.views.forEach(view => console.log(`  - ${view.name}`))
    }
    
    if (structure.tables.length > 0) {
      console.log('\nTables:')
      structure.tables.forEach(table => console.log(`  - ${table.name}`))
    }
    
    if (structure.sequences.length > 0) {
      console.log('\nSequences:')
      structure.sequences.forEach(seq => console.log(`  - ${seq.name}`))
    }
    
    if (structure.types.length > 0) {
      console.log('\nCustom Types:')
      structure.types.forEach(type => console.log(`  - ${type.name}`))
    }
    
    console.log('\n✅ Dry run completed. Use --force to execute cleanup.')
    return
  }

  try {
    // Start transaction
    await sql`BEGIN`
    
    // 1. Drop views first (no dependencies)
    if (structure.views.length > 0) {
      console.log('\n🔄 Dropping views...')
      for (const view of structure.views) {
        try {
          await sql`DROP VIEW IF EXISTS ${sql.unsafe(view.name)} CASCADE`
          console.log(`  ✅ Dropped view: ${view.name}`)
        } catch (error) {
          console.log(`  ⚠️  Failed to drop view ${view.name}:`, error)
        }
      }
    }

    // 2. Drop all tables with CASCADE (handles dependencies automatically)
    if (structure.tables.length > 0) {
      console.log('\n🔄 Dropping tables...')
      
      // Drop tables individually to handle dependencies
      for (const table of structure.tables) {
        try {
          await sql`DROP TABLE IF EXISTS ${sql.unsafe(table.name)} CASCADE`
          console.log(`  ✅ Dropped table: ${table.name}`)
        } catch (error) {
          console.log(`  ⚠️  Failed to drop table ${table.name}:`, error)
        }
      }
    }

    // 3. Drop sequences
    if (structure.sequences.length > 0) {
      console.log('\n🔄 Dropping sequences...')
      for (const sequence of structure.sequences) {
        try {
          await sql`DROP SEQUENCE IF EXISTS ${sql.unsafe(sequence.name)} CASCADE`
          console.log(`  ✅ Dropped sequence: ${sequence.name}`)
        } catch (error) {
          console.log(`  ⚠️  Failed to drop sequence ${sequence.name}:`, error)
        }
      }
    }

    // 4. Drop custom types
    if (structure.types.length > 0) {
      console.log('\n🔄 Dropping custom types...')
      for (const type of structure.types) {
        try {
          await sql`DROP TYPE IF EXISTS ${sql.unsafe(type.name)} CASCADE`
          console.log(`  ✅ Dropped type: ${type.name}`)
        } catch (error) {
          console.log(`  ⚠️  Failed to drop type ${type.name}:`, error)
        }
      }
    }

    // 5. Drop extensions if they exist and are not needed
    console.log('\n🔄 Checking extensions...')
    try {
      const extensions = await sql`
        SELECT extname 
        FROM pg_extension 
        WHERE extname NOT IN ('plpgsql')
      `
      
      for (const ext of extensions) {
        const extName = (ext as any).extname
        if (extName === 'pgcrypto') {
          // We might want to keep pgcrypto, but drop it for complete cleanup
          await sql`DROP EXTENSION IF EXISTS pgcrypto CASCADE`
          console.log(`  ✅ Dropped extension: ${extName}`)
        }
      }
    } catch (error) {
      console.log('  ⚠️  Error checking extensions:', error)
    }

    // Commit transaction
    await sql`COMMIT`
    
    console.log('\n✅ Database cleanup completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Error during cleanup, rolling back...')
    try {
      await sql`ROLLBACK`
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError)
    }
    console.error('Original error:', error)
    process.exit(1)
  }
}

async function verifyCleanup() {
  console.log('\n🔍 Verifying cleanup...')
  
  const structure = await getTablesAndViews()
  const totalObjects = structure.tables.length + structure.views.length + 
                      structure.sequences.length + structure.types.length

  if (totalObjects === 0) {
    console.log('✅ Database is completely clean!')
  } else {
    console.log(`⚠️  ${totalObjects} objects remain:`)
    if (structure.tables.length > 0) {
      console.log(`  - ${structure.tables.length} tables: ${structure.tables.map(t => t.name).join(', ')}`)
    }
    if (structure.views.length > 0) {
      console.log(`  - ${structure.views.length} views: ${structure.views.map(v => v.name).join(', ')}`)
    }
    if (structure.sequences.length > 0) {
      console.log(`  - ${structure.sequences.length} sequences: ${structure.sequences.map(s => s.name).join(', ')}`)
    }
    if (structure.types.length > 0) {
      console.log(`  - ${structure.types.length} types: ${structure.types.map(t => t.name).join(', ')}`)
    }
  }
}

async function main() {
  try {
    // Check database connection
    await sql`SELECT 1`
    console.log('✅ Database connection established')

    // Analyze current state
    const structure = await getTablesAndViews()
    const totalObjects = structure.tables.length + structure.views.length + 
                        structure.sequences.length + structure.types.length

    if (totalObjects === 0) {
      console.log('✅ Database is already empty - nothing to cleanup!')
      process.exit(0)
    }

    // Show current state
    console.log(`\n📊 Current database state:`)
    console.log(`- ${structure.tables.length} tables`)
    console.log(`- ${structure.views.length} views`)
    console.log(`- ${structure.sequences.length} sequences`)
    console.log(`- ${structure.types.length} custom types`)

    // Get data counts for tables
    if (structure.tables.length > 0) {
      const counts = await getDataCounts()
      console.log('\n📈 Data counts:')
      Object.entries(counts).forEach(([table, count]) => {
        if (count >= 0) {
          console.log(`  - ${table}: ${count.toLocaleString()} rows`)
        } else {
          console.log(`  - ${table}: Error getting count`)
        }
      })
    }

    if (isDryRun) {
      await dropAllObjects()
      return
    }

    // Require confirmation unless forced
    if (!isForced) {
      console.log('\n⚠️  WARNING: This will permanently delete ALL data and structure!')
      console.log('   - All tables and their data')
      console.log('   - All views and indexes')
      console.log('   - All sequences and custom types')
      console.log('   - This action cannot be undone')
      
      const confirmed = await confirmCleanup()
      if (!confirmed) {
        console.log('\n❌ Cleanup cancelled by user')
        process.exit(0)
      }
    }

    // Countdown
    if (!isForced) {
      console.log('\n⏰ Starting cleanup in:')
      for (let i = 3; i > 0; i--) {
        console.log(`   ${i}...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Execute cleanup
    await dropAllObjects()
    
    // Verify cleanup
    await verifyCleanup()

    console.log('\n🎉 Database cleanup completed successfully!')
    console.log('   You can now run the setup script to create the schema.')
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error)
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n❌ Cleanup interrupted by user')
  process.exit(130)
})

process.on('SIGTERM', () => {
  console.log('\n\n❌ Cleanup terminated')
  process.exit(143)
})

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧹 PostgreSQL Database Cleanup Tool

Usage: tsx scripts/cleanup-postgres.ts [options]

Options:
  --force              Skip confirmation prompts
  --dry-run           Show what would be deleted without executing
  --allow-production  Allow running in production (dangerous!)
  --help, -h          Show this help message

Environment Variables:
  DATABASE_URL        PostgreSQL connection string (required)
  ALLOW_DB_CLEANUP   Must be 'true' to enable cleanup (safety check)
  NODE_ENV           Environment (production check)

Examples:
  tsx scripts/cleanup-postgres.ts --dry-run     # Show what would be deleted
  tsx scripts/cleanup-postgres.ts --force       # Skip confirmations
  tsx scripts/cleanup-postgres.ts               # Interactive cleanup

⚠️  WARNING: This script will permanently delete all data!
`)
  process.exit(0)
}

// Run main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})