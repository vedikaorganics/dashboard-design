/**
 * Migration script to convert existing product content sections to new CMS format
 * This script will:
 * 1. Read existing products with sections from the database
 * 2. Convert old section format to new CMS block format
 * 3. Create CMS content entries for products
 * 4. Optionally preserve original data for rollback
 */

import { MongoClient, ObjectId } from 'mongodb'
import { CMSContent, ContentBlock } from '../src/types/cms'
import { ProductSection } from '../src/types'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dashboard-design'

interface OldProduct {
  _id: ObjectId
  id: string
  title: string
  description: string
  sections: ProductSection[]
  createdAt: string
  updatedAt: string
}

// Convert old product section to new CMS block
function convertSectionToBlock(section: ProductSection): ContentBlock {
  if (section.type === 'image') {
    return {
      id: `migrated_${section.id}`,
      type: 'image',
      order: section.order,
      content: {
        src: section.desktopUrl || section.mobileUrl || '',
        alt: section.alt || '',
        caption: section.caption || ''
      },
      settings: {
        padding: { top: 16, bottom: 16, left: 16, right: 16 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        backgroundColor: 'transparent'
      },
      responsive: {
        desktop: { visible: true },
        tablet: { visible: true },
        mobile: { visible: true }
      },
      visibility: {
        showOn: 'all'
      }
    }
  } else if (section.type === 'text') {
    // Convert text section to rich text
    let richText = ''
    
    if (section.heading) {
      richText += `<h2>${section.heading}</h2>`
    }
    
    if (section.body) {
      richText += `<p>${section.body}</p>`
    }
    
    if (section.items && section.items.length > 0) {
      richText += '<ul>'
      section.items.forEach(item => {
        richText += `<li>${item}</li>`
      })
      richText += '</ul>'
    }
    
    return {
      id: `migrated_${section.id}`,
      type: 'text',
      order: section.order,
      content: {
        text: richText,
        columns: 1,
        alignment: 'left'
      },
      settings: {
        padding: { top: 16, bottom: 16, left: 16, right: 16 },
        margin: { top: 0, bottom: 0, left: 0, right: 0 },
        backgroundColor: 'transparent'
      },
      responsive: {
        desktop: { visible: true },
        tablet: { visible: true },
        mobile: { visible: true }
      },
      visibility: {
        showOn: 'all'
      }
    }
  }

  // Fallback for unknown section types
  return {
    id: `migrated_${section.id}`,
    type: 'text',
    order: section.order,
    content: {
      text: `<p>Migrated content from ${section.type} section</p>`,
      columns: 1,
      alignment: 'left'
    },
    settings: {
      padding: { top: 16, bottom: 16, left: 16, right: 16 },
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      backgroundColor: 'transparent'
    },
    responsive: {
      desktop: { visible: true },
      tablet: { visible: true },
      mobile: { visible: true }
    },
    visibility: {
      showOn: 'all'
    }
  }
}

// Convert old product to CMS content
function convertProductToCMSContent(product: OldProduct): Omit<CMSContent, '_id'> {
  const blocks = product.sections
    ? product.sections
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(convertSectionToBlock)
    : []

  return {
    slug: `product-${product.id}`,
    type: 'product',
    title: product.title,
    status: 'published', // Assume existing products are published
    publishedAt: new Date(product.createdAt),
    blocks,
    seo: {
      title: product.title,
      description: product.description,
      keywords: []
    },
    settings: {
      layout: 'contained',
      headerEnabled: true,
      footerEnabled: true
    },
    version: 1,
    createdBy: 'migration-script',
    updatedBy: 'migration-script',
    createdAt: new Date(product.createdAt),
    updatedAt: new Date(product.updatedAt)
  }
}

async function migrateProductsToCMS(options: {
  dryRun?: boolean
  preserveOriginal?: boolean
  limit?: number
} = {}) {
  const { dryRun = true, preserveOriginal = true, limit } = options
  
  console.log('🚀 Starting product migration to CMS...')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`)
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db()
    
    // Collections
    const productsCollection = db.collection('products')
    const cmsCollection = db.collection('cms_content')
    const backupCollection = db.collection('products_backup') // For safety
    
    // Find products with sections
    const query = { sections: { $exists: true, $not: { $size: 0 } } }
    const products = await productsCollection
      .find(query)
      .limit(limit || 0)
      .toArray() as unknown as OldProduct[]
    
    console.log(`📦 Found ${products.length} products with content sections`)
    
    if (products.length === 0) {
      console.log('✅ No products to migrate')
      return
    }
    
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const product of products) {
      try {
        console.log(`📄 Processing: ${product.title} (${product.id})`)
        
        // Convert to CMS format
        const cmsContent = convertProductToCMSContent(product)
        
        // Check if CMS content already exists
        const existing = await cmsCollection.findOne({ slug: cmsContent.slug })
        if (existing) {
          console.log(`⏭️  Skipping ${product.title} - CMS content already exists`)
          skippedCount++
          continue
        }
        
        if (!dryRun) {
          // Backup original product if requested
          if (preserveOriginal) {
            await backupCollection.replaceOne(
              { _id: product._id },
              { ...product, migratedAt: new Date() },
              { upsert: true }
            )
          }
          
          // Insert CMS content
          await cmsCollection.insertOne(cmsContent)
          
          // Optionally remove sections from original product
          // await productsCollection.updateOne(
          //   { _id: product._id },
          //   { $unset: { sections: 1 } }
          // )
        }
        
        console.log(`✅ ${dryRun ? 'Would migrate' : 'Migrated'}: ${product.title}`)
        console.log(`   - ${product.sections?.length || 0} sections → ${cmsContent.blocks.length} blocks`)
        migratedCount++
        
      } catch (error) {
        console.error(`❌ Error processing ${product.title}:`, error)
        errorCount++
      }
    }
    
    // Summary
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Migrated: ${migratedCount}`)
    console.log(`⏭️  Skipped: ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📦 Total processed: ${products.length}`)
    
    if (dryRun) {
      console.log('\n🔍 This was a dry run. No changes were made.')
      console.log('To run the actual migration, use: npm run migrate-cms -- --live')
    } else {
      console.log('\n✅ Migration completed successfully!')
      if (preserveOriginal) {
        console.log('📋 Original products backed up to products_backup collection')
      }
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  } finally {
    await client.close()
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const isDryRun = !args.includes('--live')
  const preserveOriginal = !args.includes('--no-backup')
  const limitArg = args.find(arg => arg.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
  
  console.log('🔧 Product to CMS Migration Tool')
  console.log('================================')
  
  try {
    await migrateProductsToCMS({
      dryRun: isDryRun,
      preserveOriginal,
      limit
    })
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Rollback function
async function rollbackMigration() {
  console.log('🔄 Rolling back CMS migration...')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    const db = client.db()
    
    const cmsCollection = db.collection('cms_content')
    const backupCollection = db.collection('products_backup')
    const productsCollection = db.collection('products')
    
    // Find migrated CMS content
    const migratedContent = await cmsCollection
      .find({ 
        type: 'product',
        createdBy: 'migration-script'
      })
      .toArray()
    
    console.log(`Found ${migratedContent.length} migrated CMS entries`)
    
    // Restore from backup
    const backupProducts = await backupCollection.find({}).toArray()
    console.log(`Found ${backupProducts.length} backup products`)
    
    for (const backup of backupProducts) {
      const { _id, migratedAt, ...originalProduct } = backup
      await productsCollection.replaceOne(
        { _id: _id },
        originalProduct,
        { upsert: true }
      )
    }
    
    // Remove migrated CMS content
    await cmsCollection.deleteMany({
      type: 'product',
      createdBy: 'migration-script'
    })
    
    console.log('✅ Rollback completed')
    
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  } finally {
    await client.close()
  }
}

// Export functions for programmatic use
export {
  migrateProductsToCMS,
  rollbackMigration,
  convertSectionToBlock,
  convertProductToCMSContent
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'rollback') {
    rollbackMigration().catch(console.error)
  } else {
    main().catch(console.error)
  }
}