import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import { CampaignRedis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignsCollection = await getCollection('campaigns')
    
    // Get all campaigns from MongoDB
    const campaigns = await campaignsCollection.find({}).toArray()
    
    // Transform to Redis format
    const campaignData = campaigns.map(campaign => ({
      shortId: campaign.shortId,
      params: {
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content || '',
        utm_term: campaign.utm_term || ''
      }
    }))
    
    // Sync all campaigns to Redis (this will also delete orphaned campaigns)
    const syncResult = await CampaignRedis.syncAllCampaigns(campaignData)
    
    return NextResponse.json({
      message: 'Campaigns synced successfully',
      synced: syncResult.synced,
      deleted: syncResult.deleted,
      errors: syncResult.errors,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Campaign sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync campaigns' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignsCollection = await getCollection('campaigns')
    
    // Get counts from both sources
    const mongoCount = await campaignsCollection.countDocuments()
    const redisKeys = await CampaignRedis.getAllCampaignKeys()
    const redisCount = redisKeys.length
    
    // Check Redis health
    const healthCheck = await CampaignRedis.healthCheck()
    
    // Sample comparison (check a few campaigns for consistency)
    const sampleCampaigns = await campaignsCollection.find({}).limit(5).toArray()
    const inconsistencies = []
    
    for (const campaign of sampleCampaigns) {
      try {
        const redisData = await CampaignRedis.getCampaign(campaign.shortId)
        
        if (!redisData) {
          inconsistencies.push({
            shortId: campaign.shortId,
            issue: 'Missing in Redis'
          })
        } else {
          // Check if UTM params match
          const mongoUtm = {
            utm_source: campaign.utm_source,
            utm_medium: campaign.utm_medium,
            utm_campaign: campaign.utm_campaign,
            utm_content: campaign.utm_content || '',
            utm_term: campaign.utm_term || ''
          }
          
          const matches = Object.keys(mongoUtm).every(key => 
            mongoUtm[key as keyof typeof mongoUtm] === redisData[key as keyof typeof redisData]
          )
          
          if (!matches) {
            inconsistencies.push({
              shortId: campaign.shortId,
              issue: 'Data mismatch between MongoDB and Redis',
              mongoData: mongoUtm,
              redisData: redisData
            })
          }
        }
      } catch (error) {
        inconsistencies.push({
          shortId: campaign.shortId,
          issue: `Redis error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
    
    const status = {
      mongodb: {
        status: 'healthy',
        count: mongoCount
      },
      redis: {
        status: healthCheck.status,
        count: redisCount,
        error: healthCheck.error
      },
      sync: {
        consistent: mongoCount === redisCount && inconsistencies.length === 0,
        inconsistencies: inconsistencies.length,
        details: inconsistencies
      },
      lastChecked: new Date().toISOString()
    }
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Sync status check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check sync status',
        mongodb: { status: 'unknown' },
        redis: { status: 'unknown' },
        sync: { consistent: false }
      },
      { status: 500 }
    )
  }
}