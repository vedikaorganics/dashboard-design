#!/usr/bin/env tsx

import Mux from '@mux/mux-node'
import { getMuxTokenId, getMuxTokenSecret } from '../src/lib/env'

// Initialize Mux client
const mux = new Mux({
  tokenId: getMuxTokenId(),
  tokenSecret: getMuxTokenSecret(),
})

async function testVideoDimensions() {
  const muxAssetId = 'AfksR4AfUFN500JH738ZfFkGQM1YVqwMRHMT6nqXDjTw'
  
  console.log('🔍 Testing video dimensions for Mux Asset:', muxAssetId)
  console.log('')
  
  try {
    // Fetch asset details from Mux
    const asset = await mux.video.assets.retrieve(muxAssetId)
    
    console.log('📦 Full Asset Response:')
    console.log(JSON.stringify(asset, null, 2))
    console.log('\n')
    
    // Check tracks
    if (asset.tracks && asset.tracks.length > 0) {
      console.log(`🎬 Found ${asset.tracks.length} track(s):\n`)
      
      asset.tracks.forEach((track: any, index: number) => {
        console.log(`Track ${index}:`)
        console.log(`  Type: ${track.type}`)
        
        if (track.type === 'video') {
          console.log(`  Max Width: ${track.max_width}`)
          console.log(`  Max Height: ${track.max_height}`)
          console.log(`  Max Frame Rate: ${track.max_frame_rate}`)
          console.log(`  Duration: ${track.duration}`)
          
          // What the code is currently looking for
          console.log(`\n  ⚠️ Current code looks for:`)
          console.log(`    track.max_width: ${track.max_width || 0}`)
          console.log(`    track.max_height: ${track.max_height || 0}`)
        }
        console.log('')
      })
      
      // Find video track like the code does
      const videoTrack = asset.tracks.find((track: any) => track.type === 'video')
      if (videoTrack) {
        console.log('✅ Video track found with dimensions:')
        console.log(`   Width: ${(videoTrack as any).max_width || 0}`)
        console.log(`   Height: ${(videoTrack as any).max_height || 0}`)
      } else {
        console.log('❌ No video track found!')
      }
      
    } else {
      console.log('❌ No tracks found in asset')
    }
    
    // Check asset status
    console.log('\n📊 Asset Status:', asset.status)
    
    if (asset.status !== 'ready') {
      console.log('⚠️ Asset is not ready yet. It may still be processing.')
    }
    
  } catch (error) {
    console.error('❌ Error fetching asset:', error)
  }
  
  process.exit(0)
}

testVideoDimensions()