// Cloudflare API configuration - Using direct API calls as recommended
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!
export const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!

// Cloudflare Images configuration
export const CLOUDFLARE_IMAGES_ACCOUNT_HASH = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH!

// Upload image to Cloudflare Images
export async function uploadImageToCloudflare(file: File, metadata?: {
  alt?: string
  caption?: string
}): Promise<{
  id: string
  url: string
  variants: string[]
  filename: string
  uploaded: string
  requireSignedURLs: boolean
}> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // Ensure the image is publicly accessible
    formData.append('requireSignedURLs', 'false')
    
    // Add metadata if provided
    if (metadata) {
      const metadataString = JSON.stringify(metadata)
      formData.append('metadata', metadataString)
    }
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        body: formData
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Cloudflare Images upload failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`Cloudflare Images error: ${result.errors?.map((e: any) => e.message).join(', ')}`)
    }

    const imageData = result.result
    
    return {
      id: imageData.id,
      url: imageData.variants[0], // Default public variant URL
      variants: imageData.variants,
      filename: imageData.filename,
      uploaded: imageData.uploaded,
      requireSignedURLs: imageData.requireSignedURLs
    }
  } catch (error) {
    console.error('Error uploading image to Cloudflare:', error)
    throw error
  }
}

// Upload video to Cloudflare Stream
export async function uploadVideoToCloudflare(file: File, metadata?: {
  name?: string
  allowedOrigins?: string[]
  requireSignedURLs?: boolean
}): Promise<{
  uid: string
  status: {
    state: string
    pctComplete: string
  }
  meta: {
    name: string
  }
  playback?: {
    hls: string
    dash: string
  }
  thumbnail?: string
  watermark?: any
}> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // Set metadata for the video
    const videoMetadata = {
      name: metadata?.name || file.name,
      ...(metadata?.allowedOrigins && { allowedOrigins: metadata.allowedOrigins }),
      ...(metadata?.requireSignedURLs !== undefined && { requireSignedURLs: metadata.requireSignedURLs }),
    }
    formData.append('meta', JSON.stringify(videoMetadata))
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        body: formData
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Cloudflare Stream upload failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`Cloudflare Stream error: ${result.errors?.map((e: any) => e.message).join(', ')}`)
    }

    return result.result
  } catch (error) {
    console.error('Error uploading video to Cloudflare:', error)
    throw error
  }
}

// Delete image from Cloudflare Images
export async function deleteImageFromCloudflare(imageId: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete image: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(`Cloudflare Images delete error: ${result.errors?.map((e: any) => e.message).join(', ')}`)
    }
  } catch (error) {
    console.error('Error deleting image from Cloudflare:', error)
    throw error
  }
}

// Delete video from Cloudflare Stream
export async function deleteVideoFromCloudflare(videoUid: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoUid}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete video: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(`Cloudflare Stream delete error: ${result.errors?.map((e: any) => e.message).join(', ')}`)
    }
  } catch (error) {
    console.error('Error deleting video from Cloudflare:', error)
    throw error
  }
}

// Get image variants for different sizes
export function getImageVariant(imageId: string, variant: 'public' | 'thumbnail' | 'hero' = 'public'): string {
  return `https://imagedelivery.net/${CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${imageId}/${variant}`
}

// Get video embed/playback URL
export function getVideoEmbedUrl(videoUid: string): string {
  return `https://videodelivery.net/${videoUid}`
}

// Get video HLS stream URL
export function getVideoStreamUrl(videoUid: string): string {
  return `https://videodelivery.net/${videoUid}/manifest/video.m3u8`
}

// Get video DASH stream URL  
export function getVideoDashUrl(videoUid: string): string {
  return `https://videodelivery.net/${videoUid}/manifest/video.mpd`
}

// Get video thumbnail - with time parameter for better thumbnail generation
export function getVideoThumbnail(videoUid: string, timeSeconds: number = 1): string {
  return `https://videodelivery.net/${videoUid}/thumbnails/thumbnail.jpg?time=${timeSeconds}s`
}

// Get video thumbnail at specific dimensions
export function getVideoThumbnailWithSize(videoUid: string, width: number = 320, height: number = 240, timeSeconds: number = 1): string {
  return `https://videodelivery.net/${videoUid}/thumbnails/thumbnail.jpg?time=${timeSeconds}s&width=${width}&height=${height}`
}

// Debug function to test image URL accessibility
export async function testImageUrl(imageId: string, variant: string = 'public'): Promise<{
  url: string
  accessible: boolean
  status: number
}> {
  const url = getImageVariant(imageId, variant as any)
  
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return {
      url,
      accessible: response.ok,
      status: response.status
    }
  } catch (error) {
    return {
      url,
      accessible: false,
      status: 0
    }
  }
}