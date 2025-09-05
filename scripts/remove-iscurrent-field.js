// Migration script to remove isCurrent field from all CMS documents
// Run this after deploying the new version-based system

db = db.getSiblingDB('your_database_name') // Replace with your actual database name

print('Removing isCurrent field from CMS content documents...')

// Count documents before migration
const totalDocs = db.cms_content.countDocuments({})
print(`Found ${totalDocs} total documents`)

const docsWithIsCurrent = db.cms_content.countDocuments({ isCurrent: { $exists: true } })
print(`Found ${docsWithIsCurrent} documents with isCurrent field`)

if (docsWithIsCurrent === 0) {
  print('No documents with isCurrent field found. Migration not needed.')
} else {
  // Remove isCurrent field from all documents
  const result = db.cms_content.updateMany(
    { isCurrent: { $exists: true } },
    { $unset: { isCurrent: "" } }
  )
  
  print(`✓ Updated ${result.modifiedCount} documents`)
  print(`✓ Matched ${result.matchedCount} documents`)
  
  // Verify removal
  const remainingDocs = db.cms_content.countDocuments({ isCurrent: { $exists: true } })
  if (remainingDocs === 0) {
    print('✅ Successfully removed isCurrent field from all documents')
  } else {
    print(`⚠️  ${remainingDocs} documents still have isCurrent field`)
  }
}

print('\nMigration completed!')