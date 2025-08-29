import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { auth } from '@/lib/auth'
import { CampaignRedis } from '@/lib/redis'

// Helper function to generate random short ID
function generateShortId(length: number = 4): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function GET(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    
    const skip = (page - 1) * limit
    

    const campaignsCollection = await getCollection('campaigns')
    
    // Build search filter
    const searchFilter = search ? {
      $or: [
        { shortId: { $regex: search, $options: 'i' } },
        { utm_source: { $regex: search, $options: 'i' } },
        { utm_medium: { $regex: search, $options: 'i' } },
        { utm_campaign: { $regex: search, $options: 'i' } },
        { utm_content: { $regex: search, $options: 'i' } },
        { utm_term: { $regex: search, $options: 'i' } }
      ]
    } : {}
    
    // Get total count for pagination
    const totalCount = await campaignsCollection.countDocuments(searchFilter)
    const totalPages = Math.ceil(totalCount / limit)
    
    // Get paginated campaigns
    const campaigns = await campaignsCollection
      .find(searchFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const result = {
      campaigns: campaigns.map(campaign => ({
        _id: campaign._id,
        shortId: campaign.shortId,
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content,
        utm_term: campaign.utm_term,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary: {
        totalCampaigns: totalCount
      }
    }


    return NextResponse.json(result)
  } catch (error) {
    console.error('Campaigns API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { utm_source, utm_medium, utm_campaign, utm_content = '', utm_term = '' } = body

    if (!utm_source || !utm_medium || !utm_campaign) {
      return NextResponse.json(
        { error: 'utm_source, utm_medium, and utm_campaign are required' },
        { status: 400 }
      )
    }

    const campaignsCollection = await getCollection('campaigns')
    
    // Generate unique short ID
    let shortId: string
    let exists = true
    
    while (exists) {
      shortId = generateShortId()
      const existing = await campaignsCollection.findOne({ shortId })
      exists = !!existing
    }

    const newCampaign = {
      shortId: shortId!,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Step 1: Insert into MongoDB
    const result = await campaignsCollection.insertOne(newCampaign)
    
    // Step 2: Sync to Redis - if this fails, rollback MongoDB
    try {
      await CampaignRedis.setCampaign(shortId!, {
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term
      })
    } catch (redisError) {
      // Rollback: Delete from MongoDB
      await campaignsCollection.deleteOne({ _id: result.insertedId })
      console.error('Redis sync failed during create:', redisError)
      return NextResponse.json(
        { error: 'Failed to sync campaign to cache' },
        { status: 500 }
      )
    }
    
    // Clear cache
    
    return NextResponse.json({
      _id: result.insertedId,
      ...newCampaign
    }, { status: 201 })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { _id, utm_source, utm_medium, utm_campaign, utm_content = '', utm_term = '' } = body

    if (!_id || !utm_source || !utm_medium || !utm_campaign) {
      return NextResponse.json(
        { error: '_id, utm_source, utm_medium, and utm_campaign are required' },
        { status: 400 }
      )
    }

    const campaignsCollection = await getCollection('campaigns')
    
    // Step 1: Get old campaign data for potential rollback
    const oldCampaign = await campaignsCollection.findOne({
      _id: new (require('mongodb').ObjectId)(_id)
    })
    
    if (!oldCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    // Step 2: Update MongoDB
    const updateResult = await campaignsCollection.updateOne(
      { _id: new (require('mongodb').ObjectId)(_id) },
      {
        $set: {
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term,
          updatedAt: new Date()
        }
      }
    )

    // Step 3: Sync to Redis - if this fails, rollback MongoDB
    try {
      await CampaignRedis.updateCampaign(
        oldCampaign.shortId, 
        oldCampaign.shortId, // shortId doesn't change in PUT
        {
          utm_source,
          utm_medium,
          utm_campaign,
          utm_content,
          utm_term
        }
      )
    } catch (redisError) {
      // Rollback: Restore old campaign data in MongoDB
      await campaignsCollection.replaceOne(
        { _id: new (require('mongodb').ObjectId)(_id) },
        oldCampaign
      )
      console.error('Redis sync failed during update:', redisError)
      return NextResponse.json(
        { error: 'Failed to sync campaign update to cache' },
        { status: 500 }
      )
    }
    
    // Clear cache
    
    return NextResponse.json({ message: 'Campaign updated successfully' })
  } catch (error) {
    console.error('Update campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const _id = searchParams.get('_id')

    if (!_id) {
      return NextResponse.json(
        { error: '_id is required' },
        { status: 400 }
      )
    }

    const campaignsCollection = await getCollection('campaigns')
    
    // Step 1: Get campaign data for potential restore
    const campaign = await campaignsCollection.findOne({
      _id: new (require('mongodb').ObjectId)(_id)
    })
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    // Step 2: Delete from MongoDB
    const deleteResult = await campaignsCollection.deleteOne({
      _id: new (require('mongodb').ObjectId)(_id)
    })

    // Step 3: Delete from Redis - if this fails, restore to MongoDB
    try {
      await CampaignRedis.deleteCampaign(campaign.shortId)
    } catch (redisError) {
      // Rollback: Restore campaign to MongoDB
      await campaignsCollection.insertOne(campaign)
      console.error('Redis delete failed during delete:', redisError)
      return NextResponse.json(
        { error: 'Failed to delete campaign from cache' },
        { status: 500 }
      )
    }
    
    // Clear cache
    
    return NextResponse.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Delete campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}