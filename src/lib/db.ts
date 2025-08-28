import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '@/db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create the Neon client
const client = neon(process.env.DATABASE_URL)

// Create the Drizzle instance with schema and logging
export const db = drizzle(client, { 
  schema,
  logger: {
    logQuery: (query: string, params: unknown[]) => {
      console.log(`🔍 SQL Query: ${query}`)
      if (params.length > 0) {
        console.log(`📝 Params: ${JSON.stringify(params)}`)
      }
    }
  }
})

// Export schema for direct use
export * from '@/db/schema'