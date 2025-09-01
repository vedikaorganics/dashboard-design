// Migration script to convert existing CMS content from embedded history to separate version documents
// This script should be run ONCE to migrate existing data

db = db.getSiblingDB('your_database_name') // Replace with your actual database name

print('Starting CMS versioning migration...')

let migratedCount = 0
let errorCount = 0

// Find all current content documents that have the old history structure
const contentToMigrate = db.cms_content.find({ 
  history: { $exists: true, $ne: [] } 
}).toArray()

print(`Found ${contentToMigrate.length} documents to migrate`)

contentToMigrate.forEach(doc => {
  try {
    print(`\nMigrating: ${doc.slug} (${doc.history.length} versions)`)
    
    // Create documents for each version in history
    const versionDocuments = doc.history.map((historyEntry, index) => ({
      ...doc, // Copy all fields from original document
      version: historyEntry.version,
      blocks: historyEntry.blocks,
      isCurrent: historyEntry.version === doc.version, // Mark latest as current
      updatedBy: historyEntry.updatedBy,
      updatedAt: historyEntry.updatedAt,
      // Remove the old history field
      history: undefined,
      // Generate new _id for each version document
      _id: new ObjectId()
    }))
    
    // Remove undefined history field
    versionDocuments.forEach(vDoc => delete vDoc.history)
    
    // Start transaction for this document
    const session = db.getMongo().startSession()
    session.startTransaction()
    
    try {
      // Remove the original document
      db.cms_content.deleteOne({ _id: doc._id }, { session })
      
      // Insert all version documents
      db.cms_content.insertMany(versionDocuments, { session })
      
      session.commitTransaction()
      print(`✓ Successfully migrated ${doc.slug} with ${versionDocuments.length} versions`)
      migratedCount++
    } catch (error) {
      session.abortTransaction()
      print(`✗ Failed to migrate ${doc.slug}: ${error}`)
      errorCount++
    } finally {
      session.endSession()
    }
    
  } catch (error) {
    print(`✗ Error processing ${doc.slug}: ${error}`)
    errorCount++
  }
})

print(`\n=== Migration Summary ===`)
print(`Successfully migrated: ${migratedCount} documents`)
print(`Errors: ${errorCount} documents`)

if (errorCount === 0) {
  print('\n✓ Migration completed successfully!')
  print('\nNext steps:')
  print('1. Run the index setup script: mongo < scripts/setup-cms-indexes.js')
  print('2. Verify the migration by checking a few documents')
  print('3. Test the API endpoints')
} else {
  print('\n⚠ Migration completed with errors. Please review the errors above.')
}

print('\nTo verify migration:')
print('db.cms_content.findOne({slug: "your-test-slug", isCurrent: true})')
print('db.cms_content.find({slug: "your-test-slug"}).sort({version: -1})')