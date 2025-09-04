// Mux API configuration and helper functions
import Mux from '@mux/mux-node'
import { getMuxTokenId, getMuxTokenSecret } from './env'

// Initialize Mux client
const mux = new Mux({
  tokenId: getMuxTokenId(),
  tokenSecret: getMuxTokenSecret(),
})

// Create a direct upload URL
export async function createDirectUpload(options: {
  filename: string
  folderId?: string | null
  alt?: string
  caption?: string
  tags?: string[]
  corsOrigin?: string
}) {
  const upload = await mux.video.uploads.create({
    cors_origin: options.corsOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    new_asset_settings: {
      playback_policy: ['public'],
      // Store metadata for later retrieval
      passthrough: JSON.stringify({
        filename: options.filename,
        folderId: options.folderId,
        alt: options.alt || '',
        caption: options.caption || '',
        tags: options.tags || []
      })
    }
  })

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
    assetId: upload.asset_id
  }
}

// Get asset details from Mux
export async function getAssetDetails(assetId: string) {
  const asset = await mux.video.assets.retrieve(assetId)
  return asset
}

// Get upload details from Mux
export async function getUploadDetails(uploadId: string) {
  const upload = await mux.video.uploads.retrieve(uploadId)
  return upload
}

// Delete video asset from Mux
export async function deleteVideoFromMux(assetId: string): Promise<void> {
  try {
    await mux.video.assets.delete(assetId)
  } catch (error) {
    console.error('Error deleting video from Mux:', error)
    throw error
  }
}

// Get Mux playback URL (HLS stream)
export function getMuxPlaybackUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

// Get Mux thumbnail URL
export function getMuxThumbnailUrl(playbackId: string, options?: {
  time?: number // seconds
  width?: number
  height?: number
}): string {
  const params = new URLSearchParams()
  
  if (options?.time !== undefined) {
    params.set('time', options.time.toString())
  } else {
    params.set('time', '1') // Default to 1 second
  }
  
  if (options?.width) params.set('width', options.width.toString())
  if (options?.height) params.set('height', options.height.toString())
  
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${params.toString()}`
}

// Get Mux embed URL for iframe
export function getMuxEmbedUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}/iframe`
}

// Get Mux DASH stream URL
export function getMuxDashUrl(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}.mpd`
}

// Get Mux MP4 URL (if available)
export function getMuxMp4Url(playbackId: string): string {
  return `https://stream.mux.com/${playbackId}/high.mp4`
}

// Helper function to extract playback ID from various Mux URL formats
export function extractPlaybackIdFromUrl(url: string): string | null {
  // Handle various Mux URL formats:
  // https://stream.mux.com/PLAYBACK_ID.m3u8
  // https://stream.mux.com/PLAYBACK_ID/iframe
  // https://image.mux.com/PLAYBACK_ID/thumbnail.jpg
  
  const streamMatch = url.match(/stream\.mux\.com\/([a-zA-Z0-9]+)/);
  if (streamMatch) return streamMatch[1];
  
  const imageMatch = url.match(/image\.mux\.com\/([a-zA-Z0-9]+)/);
  if (imageMatch) return imageMatch[1];
  
  return null;
}

// Check if a URL is a Mux URL
export function isMuxUrl(url: string): boolean {
  return url.includes('stream.mux.com') || url.includes('image.mux.com')
}

// Get video metadata from Mux asset
export async function getVideoMetadata(assetId: string): Promise<{
  width: number
  height: number
  duration: number
  ready: boolean
} | null> {
  try {
    const asset = await mux.video.assets.retrieve(assetId)
    
    const videoTrack = asset.tracks?.find((track: any) => track.type === 'video')
    
    return {
      width: (videoTrack as any)?.width || 0,
      height: (videoTrack as any)?.height || 0,
      duration: asset.duration || 0,
      ready: asset.status === 'ready'
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error)
    return null
  }
}

// List all assets (for admin purposes)
export async function listAssets(options?: {
  limit?: number
  page?: number
}) {
  const assets = await mux.video.assets.list({
    limit: options?.limit || 25,
    page: options?.page || 1
  })
  
  return assets
}