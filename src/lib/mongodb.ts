import { MongoClient, Db } from 'mongodb'
import { getMongoDbUri } from './env'

const uri = getMongoDbUri()

// Optimized MongoDB connection options for Vercel serverless
const options = {
  maxPoolSize: 3, // Reduced for serverless - less connections per instance
  serverSelectionTimeoutMS: 10000, // Increased timeout for cold starts
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  heartbeatFrequencyMS: 10000, // Send heartbeat every 10 seconds to detect connection issues
  retryWrites: true, // Automatically retry failed writes
  retryReads: true, // Automatically retry failed reads
  connectTimeoutMS: 10000, // 10 second connection timeout
  maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

// Connection retry logic with exponential backoff
async function createConnectionWithRetry(): Promise<MongoClient> {
  const maxRetries = 3
  const baseDelay = 1000 // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 MongoDB: Connection attempt ${attempt}/${maxRetries}`)
      const client = new MongoClient(uri, options)
      await client.connect()
      
      // Test the connection
      await client.db().admin().ping()
      console.log('✅ MongoDB: Connection successful')
      
      return client
    } catch (error) {
      console.error(`❌ MongoDB: Connection attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error('💥 MongoDB: All connection attempts failed')
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts: ${error}`)
      }
      
      // Exponential backoff: wait longer between each retry
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`⏳ MongoDB: Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('MongoDB connection failed - this should never be reached')
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createConnectionWithRetry()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = createConnectionWithRetry()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

// Helper function to get the database with error handling
export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise
    return client.db() // Uses the database name from the connection string
  } catch (error) {
    console.error('❌ MongoDB: Failed to get database:', error)
    throw new Error(`Database connection failed: ${error}`)
  }
}

// Collection helpers for type safety with error handling
export async function getCollection(collectionName: string) {
  try {
    const db = await getDatabase()
    return db.collection(collectionName)
  } catch (error) {
    console.error(`❌ MongoDB: Failed to get collection '${collectionName}':`, error)
    throw new Error(`Collection '${collectionName}' access failed: ${error}`)
  }
}

// Export the client promise for auth.ts to use
export { clientPromise }