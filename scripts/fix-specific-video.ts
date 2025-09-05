#!/usr/bin/env tsx

// Simple script to fix the specific video dimensions via API call
import { spawn } from 'child_process'

async function fixSpecificVideo() {
  console.log('🔧 Fixing specific video dimensions...\n')
  
  const muxAssetId = 'AfksR4AfUFN500JH738ZfFkGQM1YVqwMRHMT6nqXDjTw'
  const apiUrl = 'http://localhost:3000/api/cms/media/dimensions'
  const queryParams = `type=video&muxAssetId=${muxAssetId}`
  
  console.log('📡 Testing dimensions API:')
  console.log(`   URL: ${apiUrl}?${queryParams}`)
  
  // Use curl to test the API
  const curlProcess = spawn('curl', ['-s', `${apiUrl}?${queryParams}`], { 
    stdio: 'inherit'
  })
  
  curlProcess.on('close', (code) => {
    console.log(`\n\n✅ API test completed with code: ${code}`)
    console.log('\n📝 The video asset in the database should show dimensions as 0×0,')
    console.log('   but the API call above should return 720×1280 from Mux.')
    console.log('\n🔧 To fix this permanently:')
    console.log('   1. New video uploads will use the retry logic')
    console.log('   2. Set up Mux webhooks to update dimensions when ready')
    console.log('   3. Run migration script when database connection is fixed')
    process.exit(0)
  })
  
  curlProcess.on('error', (err) => {
    console.error('❌ Error running curl:', err)
    process.exit(1)
  })
}

fixSpecificVideo()