import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Campaign UTM parameters interface
interface CampaignParams {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content?: string
  utm_term?: string
}

// Retry function with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries - 1) {
        throw lastError
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

// Redis campaign operations
export class CampaignRedis {
  private static generateKey(shortId: string): string {
    return `campaign:${shortId}`
  }
  
  static async setCampaign(shortId: string, params: CampaignParams): Promise<void> {
    await withRetry(async () => {
      await redis.set(this.generateKey(shortId), JSON.stringify(params))
    })
  }
  
  static async getCampaign(shortId: string): Promise<CampaignParams | null> {
    return withRetry(async () => {
      const result = await redis.get(this.generateKey(shortId))
      if (!result) return null
      
      // Handle different data types from Redis
      if (typeof result === 'string') {
        try {
          return JSON.parse(result)
        } catch (error) {
          console.error(`Failed to parse Redis data for ${shortId}:`, result, error)
          return null
        }
      } else if (typeof result === 'object') {
        // Upstash sometimes returns objects directly
        return result as CampaignParams
      }
      
      console.error(`Unexpected Redis data type for ${shortId}:`, typeof result, result)
      return null
    })
  }
  
  static async deleteCampaign(shortId: string): Promise<void> {
    await withRetry(async () => {
      await redis.del(this.generateKey(shortId))
    })
  }
  
  // Update campaign (handles key changes)
  static async updateCampaign(
    oldShortId: string, 
    newShortId: string, 
    params: CampaignParams
  ): Promise<void> {
    await withRetry(async () => {
      // If shortId changed, delete old key
      if (oldShortId !== newShortId) {
        await redis.del(this.generateKey(oldShortId))
      }
      // Set new key
      await redis.set(this.generateKey(newShortId), JSON.stringify(params))
    })
  }
  
  // Get all campaign keys for sync validation
  static async getAllCampaignKeys(): Promise<string[]> {
    return withRetry(async () => {
      const keys = await redis.keys('campaign:*')
      return keys.map(key => key.replace('campaign:', ''))
    })
  }
  
  // Bulk sync all campaigns - ensures Redis exactly matches MongoDB
  static async syncAllCampaigns(campaigns: Array<{shortId: string, params: CampaignParams}>): Promise<{
    synced: number,
    deleted: number,
    errors: string[]
  }> {
    return withRetry(async () => {
      const errors: string[] = []
      let syncedCount = 0
      let deletedCount = 0
      
      try {
        // Get existing Redis keys
        const existingKeys = await redis.keys('campaign:*')
        const existingShortIds = existingKeys.map(key => key.replace('campaign:', ''))
        
        // Get MongoDB campaign short IDs
        const mongoShortIds = campaigns.map(c => c.shortId)
        
        // Find campaigns to delete (exist in Redis but not in MongoDB)
        const toDelete = existingShortIds.filter(shortId => !mongoShortIds.includes(shortId))
        
        // Delete campaigns that no longer exist in MongoDB
        if (toDelete.length > 0) {
          const keysToDelete = toDelete.map(shortId => this.generateKey(shortId))
          await redis.del(...keysToDelete)
          deletedCount = toDelete.length
        }
        
        // Sync all MongoDB campaigns to Redis
        if (campaigns.length > 0) {
          // Use individual set operations instead of pipeline for better error handling
          for (const { shortId, params } of campaigns) {
            try {
              await redis.set(this.generateKey(shortId), JSON.stringify(params))
              syncedCount++
            } catch (error) {
              errors.push(`Failed to sync campaign ${shortId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }
        }
        
        return { synced: syncedCount, deleted: deletedCount, errors }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown sync error')
        return { synced: syncedCount, deleted: deletedCount, errors }
      }
    })
  }
  
  // Health check
  static async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy', error?: string }> {
    try {
      await redis.ping()
      return { status: 'healthy' }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export { redis }