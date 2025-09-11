import { connectToDatabase } from '@/lib/mongodb'
import { AUTHORS_COLLECTION, generateSlug, createIndexes } from './utils'
import type { Author } from '@/types/authors'

export interface MigrationResult {
  success: boolean
  authorsCreated: number
  postsUpdated: number
  errors: string[]
  authorsMapping: Record<string, string> // old author name -> new slug
}

/**
 * Migrate existing blog authors from blogAuthor field to author profiles system
 */
export async function migrateBlogAuthors(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    authorsCreated: 0,
    postsUpdated: 0,
    errors: [],
    authorsMapping: {}
  }

  try {
    const { db } = await connectToDatabase()
    
    // Ensure indexes exist for authors collection
    await createIndexes(db)
    
    // Step 1: Get all unique blog authors from existing posts
    console.log('🔍 Scanning existing blog posts for authors...')
    
    const uniqueAuthors = await db.collection('cms_content').aggregate([
      {
        $match: {
          type: 'blog',
          blogAuthor: { $exists: true, $ne: null, $nin: ['', null] }
        }
      },
      {
        $group: {
          _id: '$blogAuthor',
          postCount: { $sum: 1 },
          firstPost: { $min: '$createdAt' },
          lastPost: { $max: '$publishedAt' }
        }
      },
      {
        $sort: { postCount: -1 }
      }
    ]).toArray()

    console.log(`📊 Found ${uniqueAuthors.length} unique authors`)

    // Step 2: Create author profiles for each unique author
    for (const authorData of uniqueAuthors) {
      const authorName = authorData._id as string
      const slug = generateSlug(authorName)
      
      try {
        // Check if author with this slug already exists
        const existingAuthor = await db.collection(AUTHORS_COLLECTION)
          .findOne({ slug })
        
        if (existingAuthor) {
          console.log(`⚠️  Author with slug "${slug}" already exists, skipping...`)
          result.authorsMapping[authorName] = slug
          continue
        }

        // Create new author profile
        const newAuthor: Partial<Author> = {
          slug,
          displayName: authorName,
          bio: `Author profile migrated from legacy blog system. Originally had ${authorData.postCount} posts.`,
          status: 'active' as const,
          featured: authorData.postCount >= 5, // Feature authors with 5+ posts
          stats: {
            postCount: authorData.postCount,
            totalViews: 0, // Will be calculated later
            lastPublished: authorData.lastPost || undefined
          },
          createdAt: authorData.firstPost || new Date(),
          updatedAt: new Date(),
          createdBy: 'migration-script',
          updatedBy: 'migration-script'
        }

        const { _id, ...insertData } = newAuthor
        await db.collection(AUTHORS_COLLECTION).insertOne(insertData as any)
        
        result.authorsCreated++
        result.authorsMapping[authorName] = slug
        
        console.log(`✅ Created author profile: ${authorName} -> ${slug}`)
        
      } catch (error) {
        const errorMsg = `Failed to create author "${authorName}": ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    // Step 3: Update all blog posts to use authorSlug instead of blogAuthor
    console.log('🔄 Updating blog posts with author slugs...')
    
    for (const [authorName, authorSlug] of Object.entries(result.authorsMapping)) {
      try {
        const updateResult = await db.collection('cms_content').updateMany(
          {
            type: 'blog',
            blogAuthor: authorName
          },
          {
            $set: {
              authorSlug: authorSlug,
              updatedAt: new Date(),
              updatedBy: 'migration-script'
            }
          }
        )
        
        result.postsUpdated += updateResult.modifiedCount
        console.log(`📝 Updated ${updateResult.modifiedCount} posts for author: ${authorName}`)
        
      } catch (error) {
        const errorMsg = `Failed to update posts for author "${authorName}": ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    // Step 4: Recalculate author statistics
    console.log('📊 Recalculating author statistics...')
    
    for (const authorSlug of Object.values(result.authorsMapping)) {
      try {
        const [stats] = await db.collection('cms_content').aggregate([
          {
            $match: {
              authorSlug: authorSlug,
              type: 'blog'
            }
          },
          {
            $group: {
              _id: null,
              postCount: { $sum: 1 },
              totalViews: { $sum: { $ifNull: ['$views', 0] } },
              lastPublished: { $max: '$publishedAt' }
            }
          }
        ]).toArray()

        if (stats) {
          await db.collection(AUTHORS_COLLECTION).updateOne(
            { slug: authorSlug },
            {
              $set: {
                'stats.postCount': stats.postCount,
                'stats.totalViews': stats.totalViews,
                'stats.lastPublished': stats.lastPublished,
                updatedAt: new Date()
              }
            }
          )
        }
        
      } catch (error) {
        const errorMsg = `Failed to update stats for author "${authorSlug}": ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }

    result.success = result.errors.length === 0
    
    console.log('✨ Migration completed!')
    console.log(`📈 Summary:`)
    console.log(`   - Authors created: ${result.authorsCreated}`)
    console.log(`   - Posts updated: ${result.postsUpdated}`)
    console.log(`   - Errors: ${result.errors.length}`)
    
    return result
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    result.errors.push(`Migration failed: ${error}`)
    return result
  }
}

/**
 * Rollback migration - restore blogAuthor fields and remove author profiles
 * WARNING: This will delete all author profiles created during migration
 */
export async function rollbackMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    authorsCreated: 0,
    postsUpdated: 0,
    errors: [],
    authorsMapping: {}
  }

  try {
    const { db } = await connectToDatabase()
    
    console.log('🔄 Rolling back migration...')
    
    // Get all authors created by migration script
    const migrationAuthors = await db.collection(AUTHORS_COLLECTION)
      .find({ createdBy: 'migration-script' })
      .toArray()
    
    // For each migration author, restore blogAuthor field in posts
    for (const author of migrationAuthors) {
      try {
        const updateResult = await db.collection('cms_content').updateMany(
          {
            type: 'blog',
            authorSlug: author.slug
          },
          {
            $set: {
              blogAuthor: author.displayName,
              updatedAt: new Date()
            },
            $unset: {
              authorSlug: ''
            }
          }
        )
        
        result.postsUpdated += updateResult.modifiedCount
        console.log(`📝 Restored ${updateResult.modifiedCount} posts for author: ${author.displayName}`)
        
      } catch (error) {
        const errorMsg = `Failed to restore posts for author "${author.displayName}": ${error}`
        console.error(errorMsg)
        result.errors.push(errorMsg)
      }
    }
    
    // Delete migration authors
    const deleteResult = await db.collection(AUTHORS_COLLECTION).deleteMany({
      createdBy: 'migration-script'
    })
    
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} migration authors`)
    
    result.success = result.errors.length === 0
    
    console.log('✨ Rollback completed!')
    console.log(`📈 Summary:`)
    console.log(`   - Authors deleted: ${deleteResult.deletedCount}`)
    console.log(`   - Posts restored: ${result.postsUpdated}`)
    console.log(`   - Errors: ${result.errors.length}`)
    
    return result
    
  } catch (error) {
    console.error('💥 Rollback failed:', error)
    result.errors.push(`Rollback failed: ${error}`)
    return result
  }
}

/**
 * Get migration status - check if migration has been run
 */
export async function getMigrationStatus() {
  try {
    const { db } = await connectToDatabase()
    
    const migrationAuthorsCount = await db.collection(AUTHORS_COLLECTION)
      .countDocuments({ createdBy: 'migration-script' })
    
    const postsWithAuthorSlug = await db.collection('cms_content')
      .countDocuments({ 
        type: 'blog', 
        authorSlug: { $exists: true, $ne: null } 
      })
    
    const postsWithBlogAuthor = await db.collection('cms_content')
      .countDocuments({ 
        type: 'blog', 
        blogAuthor: { $exists: true, $ne: null, $nin: ['', null] } 
      })
    
    return {
      migrationAuthorsCount,
      postsWithAuthorSlug,
      postsWithBlogAuthor,
      migrationCompleted: migrationAuthorsCount > 0 && postsWithAuthorSlug > 0,
      needsMigration: postsWithBlogAuthor > 0 && migrationAuthorsCount === 0
    }
    
  } catch (error) {
    console.error('Failed to get migration status:', error)
    return {
      migrationAuthorsCount: 0,
      postsWithAuthorSlug: 0,
      postsWithBlogAuthor: 0,
      migrationCompleted: false,
      needsMigration: false,
      error: String(error)
    }
  }
}