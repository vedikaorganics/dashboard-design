#!/usr/bin/env tsx

import { getDatabase } from '../src/lib/mongodb'

async function checkMediaDimensions() {
  console.log('🔍 Checking media dimensions status...\n')

  try {
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    
    // Get total counts
    const totalAssets = await assetsCollection.countDocuments()
    const totalImages = await assetsCollection.countDocuments({ type: 'image' })
    const totalVideos = await assetsCollection.countDocuments({ type: 'video' })
    
    console.log(`📊 Total Assets: ${totalAssets}`)
    console.log(`📷 Images: ${totalImages}`)
    console.log(`🎬 Videos: ${totalVideos}\n`)
    
    // Check dimensions status
    const assetsWithNullDimensions = await assetsCollection.countDocuments({ dimensions: null })
    const assetsWithMissingDimensions = await assetsCollection.countDocuments({ dimensions: { $exists: false } })
    const assetsWithZeroDimensions = await assetsCollection.countDocuments({
      $or: [
        { 'dimensions.width': { $lte: 0 } },
        { 'dimensions.height': { $lte: 0 } }
      ]
    })
    const assetsWithValidDimensions = await assetsCollection.countDocuments({
      'dimensions.width': { $gt: 0 },
      'dimensions.height': { $gt: 0 }
    })
    
    console.log('📐 Dimensions Status:')
    console.log(`  ✅ Valid dimensions: ${assetsWithValidDimensions}`)
    console.log(`  ❌ Null dimensions: ${assetsWithNullDimensions}`)
    console.log(`  ❌ Missing dimensions: ${assetsWithMissingDimensions}`)
    console.log(`  ❌ Zero dimensions: ${assetsWithZeroDimensions}\n`)
    
    // Check by type
    const imagesWithValidDimensions = await assetsCollection.countDocuments({
      type: 'image',
      'dimensions.width': { $gt: 0 },
      'dimensions.height': { $gt: 0 }
    })
    const imagesWithInvalidDimensions = totalImages - imagesWithValidDimensions
    
    const videosWithValidDimensions = await assetsCollection.countDocuments({
      type: 'video',
      'dimensions.width': { $gt: 0 },
      'dimensions.height': { $gt: 0 }
    })
    const videosWithInvalidDimensions = totalVideos - videosWithValidDimensions
    
    console.log('📷 Images:')
    console.log(`  ✅ Valid: ${imagesWithValidDimensions}/${totalImages} (${Math.round((imagesWithValidDimensions / totalImages) * 100)}%)`)
    console.log(`  ❌ Invalid: ${imagesWithInvalidDimensions}/${totalImages} (${Math.round((imagesWithInvalidDimensions / totalImages) * 100)}%)\n`)
    
    console.log('🎬 Videos:')
    console.log(`  ✅ Valid: ${videosWithValidDimensions}/${totalVideos} (${Math.round((videosWithValidDimensions / totalVideos) * 100)}%)`)
    console.log(`  ❌ Invalid: ${videosWithInvalidDimensions}/${totalVideos} (${Math.round((videosWithInvalidDimensions / totalVideos) * 100)}%)\n`)
    
    // Sample some assets to show their current state
    console.log('🔍 Sample Assets:')
    
    const sampleAssets = await assetsCollection.find({}).limit(5).toArray()
    sampleAssets.forEach((asset, index) => {
      const dimensionStatus = asset.dimensions 
        ? (asset.dimensions.width > 0 && asset.dimensions.height > 0 
           ? `${asset.dimensions.width}x${asset.dimensions.height}` 
           : `${asset.dimensions.width || 0}x${asset.dimensions.height || 0} (INVALID)`)
        : 'NULL'
      
      console.log(`  ${index + 1}. [${asset.type.toUpperCase()}] ${asset.filename}`)
      console.log(`     Dimensions: ${dimensionStatus}`)
      
      if (asset.type === 'image' && asset.metadata?.cloudflareId) {
        console.log(`     Cloudflare ID: ${asset.metadata.cloudflareId}`)
      } else if (asset.type === 'video' && asset.metadata?.muxAssetId) {
        console.log(`     Mux Asset ID: ${asset.metadata.muxAssetId}`)
      }
      console.log()
    })
    
    if (imagesWithInvalidDimensions > 0 || videosWithInvalidDimensions > 0) {
      console.log('💡 To fix missing dimensions, run:')
      console.log('   npx tsx scripts/migrate-media-dimensions.ts')
    } else {
      console.log('🎉 All media assets have valid dimensions!')
    }
    
  } catch (error) {
    console.error('❌ Error checking media dimensions:', error)
  } finally {
    process.exit(0)
  }
}

checkMediaDimensions()