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

// Get image variants for different sizes
export function getImageVariant(imageId: string, variant: 'public' | 'thumbnail' | 'hero' = 'public'): string {
  return `https://imagedelivery.net/${CLOUDFLARE_IMAGES_ACCOUNT_HASH}/${imageId}/${variant}`
}

// Get image metadata from Cloudflare Images API
export async function getImageMetadata(imageId: string): Promise<{
  width: number
  height: number
  format: string
  fileSize: number
} | null> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      console.error(`Failed to fetch image metadata: ${response.status} ${response.statusText}`)
      return null
    }

    const result = await response.json()
    
    if (!result.success || !result.result) {
      console.error('Cloudflare Images API error:', result.errors)
      return null
    }

    const metadata = result.result
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      fileSize: metadata.fileSize || 0
    }
  } catch (error) {
    console.error('Error fetching image metadata:', error)
    return null
  }
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

// Legacy export for backward compatibility with existing Cloudflare Stream videos
export async function deleteVideoFromCloudflare(videoUid: string): Promise<void> {
  throw new Error('Cloudflare Stream is deprecated. Use deleteVideoFromMux instead.')
}