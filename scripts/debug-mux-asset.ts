#!/usr/bin/env tsx

import { getDatabase } from '../src/lib/mongodb'
import Mux from '@mux/mux-node'
import { getMuxTokenId, getMuxTokenSecret } from '../src/lib/env'

// Initialize Mux client
const mux = new Mux({
  tokenId: getMuxTokenId(),
  tokenSecret: getMuxTokenSecret(),
})

async function debugMuxAsset() {
  try {
    console.log('🔍 Debugging Mux Asset Structure...\n')

    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    
    // Find a video asset with muxAssetId
    const videoAsset = await assetsCollection.findOne({
      type: 'video',
      'metadata.muxAssetId': { $exists: true }
    })
    
    if (!videoAsset) {
      console.log('❌ No video assets with muxAssetId found')
      return
    }
    
    const muxAssetId = videoAsset.metadata.muxAssetId
    console.log(`📹 Found video asset: ${videoAsset.filename}`)
    console.log(`🆔 Mux Asset ID: ${muxAssetId}`)
    console.log(`📊 Current saved dimensions: ${JSON.stringify(videoAsset.dimensions)}\n`)
    
    // Fetch asset details from Mux
    console.log('🌐 Fetching asset details from Mux...')
    const asset = await mux.video.assets.retrieve(muxAssetId)
    
    console.log('📦 Full Mux Asset Response:')
    console.log(JSON.stringify(asset, null, 2))
    console.log('\n')
    
    // Analyze tracks
    if (asset.tracks && asset.tracks.length > 0) {
      console.log(`🎬 Found ${asset.tracks.length} track(s):`)
      asset.tracks.forEach((track, index) => {
        console.log(`\n  Track ${index}:`)
        console.log(`    Type: ${track.type}`)
        console.log(`    Full track data:`, JSON.stringify(track, null, 4))
        
        if (track.type === 'video') {
          console.log(`    Width: ${(track as any).width}`)
          console.log(`    Height: ${(track as any).height}`)
          console.log(`    Max Width: ${(track as any).max_width}`)
          console.log(`    Max Height: ${(track as any).max_height}`)
        }
      })
    } else {
      console.log('❌ No tracks found in asset')
    }
    
    // Try different paths to find dimensions
    console.log('\n🔍 Checking different dimension paths:')
    console.log(`asset.video?.width: ${(asset as any).video?.width}`)
    console.log(`asset.video?.height: ${(asset as any).video?.height}`)
    console.log(`asset.aspect_ratio: ${asset.aspect_ratio}`)
    console.log(`asset.resolution_tier: ${asset.resolution_tier}`)
    
    const videoTrack = asset.tracks?.find((track: any) => track.type === 'video')
    if (videoTrack) {
      console.log('\n🎯 Video track found:')
      console.log(`  Current extraction logic: width=${(videoTrack as any).width || 0}, height=${(videoTrack as any).height || 0}`)
      
      // Try alternative property names
      const possibleProps = ['width', 'height', 'max_width', 'max_height', 'frame_rate', 'duration']
      possibleProps.forEach(prop => {
        if ((videoTrack as any)[prop] !== undefined) {
          console.log(`  ${prop}: ${(videoTrack as any)[prop]}`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error debugging Mux asset:', error)
  } finally {
    process.exit(0)
  }
}

debugMuxAsset()