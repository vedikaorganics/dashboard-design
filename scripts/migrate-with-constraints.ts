#!/usr/bin/env tsx

import { spawn } from 'child_process'
import { config } from 'dotenv'

config({ path: '.env' })

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`)
    const child = spawn(command, args, { stdio: 'inherit' })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Command failed with code ${code}`))
      }
    })
  })
}

async function migrateWithConstraints() {
  try {
    console.log('🚀 Starting complete migration process...')
    
    // Step 1: Run migration with clean and test flags
    console.log('\n📋 Step 1: Running migration with clean and setup...')
    await runCommand('npm', ['run', 'migrate:all', '--', '--clean', '--test'])
    
    // Step 2: Update all constraints
    console.log('\n🔧 Step 2: Updating database constraints...')
    await runCommand('tsx', ['scripts/update-all-constraints.ts'])
    await runCommand('tsx', ['scripts/update-constraint.ts'])
    
    // Step 3: Run migration again without clean flag
    console.log('\n🔄 Step 3: Re-running migration with fixed constraints...')
    await runCommand('npm', ['run', 'migrate:all', '--', '--test'])
    
    console.log('\n✅ Complete migration process finished successfully!')
    
  } catch (error) {
    console.error('\n❌ Migration process failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

migrateWithConstraints()