// MongoDB index setup script for CMS version-based system
// Run this script to create optimal indexes for the simplified versioning system

db = db.getSiblingDB('your_database_name') // Replace with your actual database name

print('Setting up CMS content indexes for version-based system...')

// Primary index for getting latest version of content
db.cms_content.createIndex(
  { slug: 1, version: -1 },
  { name: 'slug_version_idx' }
)
print('✓ Created index: slug + version (descending)')

// Index for published content queries (public API)
db.cms_content.createIndex(
  { slug: 1, status: 1, version: -1 },
  { name: 'slug_status_version_idx' }
)
print('✓ Created index: slug + status + version')

// Index for content type aggregation queries
db.cms_content.createIndex(
  { type: 1, status: 1, version: -1 },
  { name: 'type_status_version_idx' }
)
print('✓ Created index: type + status + version')

// Index for product content queries
db.cms_content.createIndex(
  { productId: 1, version: -1 },
  { name: 'productId_version_idx' }
)
print('✓ Created index: productId + version')

// Index for version history and rollback operations
db.cms_content.createIndex(
  { slug: 1, createdAt: -1 },
  { name: 'slug_created_idx' }
)
print('✓ Created index: slug + createdAt (for version history)')

// Index for cleanup operations (optional TTL index for old versions)
// Uncomment if you want to auto-delete versions older than 2 years
/*
db.cms_content.createIndex(
  { createdAt: 1 },
  { 
    name: 'cleanup_ttl_idx',
    expireAfterSeconds: 63072000, // 2 years
    partialFilterExpression: { 
      version: { $lt: 10 } // Only auto-delete if there are many versions
    }
  }
)
print('✓ Created TTL index for old versions cleanup')
*/

print('\nIndex creation completed!')
print('\nTo verify indexes, run:')
print('db.cms_content.getIndexes()')

print('\nOptimal queries with these indexes:')
print('- Get latest version: db.cms_content.findOne({slug: "..."}, {sort: {version: -1}})')
print('- Get latest published: db.cms_content.findOne({slug: "...", status: "published"}, {sort: {version: -1}})')
print('- List latest of each type: Use aggregation pipeline with $group + $first')
print('- Get version history: db.cms_content.find({slug: "..."}).sort({version: -1})')