#!/usr/bin/env tsx

import { getDatabase } from '../src/lib/mongodb'
import { getImageVariant } from '../src/lib/cloudflare'
import { getVideoMetadata } from '../src/lib/mux'
import { ObjectId } from 'mongodb'

// Helper function to extract image dimensions from image data
async function getImageDimensionsFromUrl(imageUrl: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    // PNG dimensions
    if (buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
      const width = buffer.readUInt32BE(16)
      const height = buffer.readUInt32BE(20)
      return { width, height }
    }
    
    // JPEG dimensions
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2
      while (offset < buffer.length - 4) {
        const marker = buffer.readUInt16BE(offset)
        if ((marker & 0xFF00) !== 0xFF00) break
        
        const length = buffer.readUInt16BE(offset + 2)
        if (marker === 0xFFC0 || marker === 0xFFC2) {
          const height = buffer.readUInt16BE(offset + 5)
          const width = buffer.readUInt16BE(offset + 7)
          return { width, height }
        }
        offset += 2 + length
      }
    }
    
    // GIF dimensions
    if (buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a') {
      const width = buffer.readUInt16LE(6)
      const height = buffer.readUInt16LE(8)
      return { width, height }
    }
    
    // WebP dimensions
    if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
      const format = buffer.subarray(12, 16).toString()
      if (format === 'VP8 ') {
        const width = buffer.readUInt16LE(26) & 0x3FFF
        const height = buffer.readUInt16LE(28) & 0x3FFF
        return { width, height }
      } else if (format === 'VP8L') {
        const data = buffer.readUInt32LE(21)
        const width = (data & 0x3FFF) + 1
        const height = ((data >> 14) & 0x3FFF) + 1
        return { width, height }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error extracting image dimensions:', error)
    return null
  }
}

async function migrateMediaDimensions() {
  console.log('🔄 Starting media dimensions migration...\n')

  try {
    const db = await getDatabase()
    const assetsCollection = db.collection('cms_media_assets')
    
    // Find all assets with missing or invalid dimensions
    const assetsWithMissingDimensions = await assetsCollection.find({
      $or: [
        { dimensions: null },
        { dimensions: { $exists: false } },
        { 'dimensions.width': { $lte: 0 } },
        { 'dimensions.height': { $lte: 0 } }
      ]
    }).toArray()
    
    // Separate videos from other assets for different handling
    const videosWithMissingDimensions = assetsWithMissingDimensions.filter(asset => asset.type === 'video')
    const imagesWithMissingDimensions = assetsWithMissingDimensions.filter(asset => asset.type === 'image')
    
    console.log(`📊 Found ${assetsWithMissingDimensions.length} assets with missing or invalid dimensions`)
    console.log(`📷 Images: ${imagesWithMissingDimensions.length}`)
    console.log(`🎬 Videos: ${videosWithMissingDimensions.length}`)
    
    if (assetsWithMissingDimensions.length === 0) {
      console.log('✅ No assets need dimension updates')
      return
    }
    
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const asset of assetsWithMissingDimensions) {
      console.log(`\n🔍 Processing ${asset.type}: ${asset.filename} (${asset._id})`)
      
      try {
        let dimensions: { width: number; height: number } | null = null
        
        if (asset.type === 'image' && asset.metadata?.cloudflareId) {
          console.log('  📷 Fetching image dimensions from Cloudflare...')
          const imageUrl = getImageVariant(asset.metadata.cloudflareId, 'public')
          dimensions = await getImageDimensionsFromUrl(imageUrl)
          
          if (dimensions) {
            console.log(`  ✓ Found dimensions: ${dimensions.width}x${dimensions.height}`)
          } else {
            console.log('  ⚠️  Could not extract dimensions from image')
          }
          
        } else if (asset.type === 'video' && asset.metadata?.muxAssetId) {
          console.log('  🎬 Fetching video dimensions from Mux...')
          console.log(`     Mux Asset ID: ${asset.metadata.muxAssetId}`)
          console.log(`     Asset Status: ${asset.metadata.status || 'unknown'}`)
          
          const metadata = await getVideoMetadata(asset.metadata.muxAssetId)
          
          if (metadata && metadata.width > 0 && metadata.height > 0) {
            dimensions = { width: metadata.width, height: metadata.height }
            console.log(`  ✓ Found dimensions: ${dimensions.width}x${dimensions.height}`)
          } else {
            console.log(`  ⚠️  Could not get valid dimensions from Mux. Metadata:`, metadata)
            
            // For videos, if asset is ready but still no dimensions, it might be an encoding issue
            if (asset.metadata.status === 'ready') {
              console.log('  📊 Asset is ready but no dimensions - this may be an older asset')
            } else {
              console.log('  ⏳ Asset may still be processing')
            }
          }
          
        } else {
          console.log('  ⚠️  Skipping: Missing required metadata ID')
          skipped++
          continue
        }
        
        if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
          // Update the asset with the new dimensions
          await assetsCollection.updateOne(
            { _id: asset._id },
            { 
              $set: { 
                dimensions: dimensions,
                updatedAt: new Date()
              } 
            }
          )
          
          console.log('  ✅ Updated successfully')
          updated++
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } else {
          console.log('  ❌ Failed to get valid dimensions')
          skipped++
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing asset ${asset._id}:`, error)
        errors++
      }
    }
    
    console.log('\n📈 Migration Summary:')
    console.log(`✅ Updated: ${updated} assets`)
    console.log(`⚠️  Skipped: ${skipped} assets`)
    console.log(`❌ Errors: ${errors} assets`)
    console.log(`📊 Total processed: ${assetsWithMissingDimensions.length} assets`)
    
    if (updated > 0) {
      console.log('\n🎉 Migration completed successfully!')
    } else {
      console.log('\n⚠️  No assets were updated. Check the logs above for details.')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    process.exit(0)
  }
}

// Allow running with --dry-run flag to preview changes
const isDryRun = process.argv.includes('--dry-run')

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n')
}

migrateMediaDimensions()