/**
 * Utility for revalidating statically generated pages on the main website
 */

interface RevalidateOptions {
  paths: string[]
  secret?: string
}

export async function revalidateWebsitePages(options: RevalidateOptions) {
  const { paths, secret } = options
  const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL

  if (!baseUrl) {
    console.error('NEXT_PUBLIC_PAYMENT_SERVER_URL not configured')
    return { success: false, error: 'Base URL not configured' }
  }

  // Use API key from environment if no secret provided
  const revalidateSecret = secret || process.env.PAYMENT_SERVER_API_KEY

  try {
    const results = await Promise.allSettled(
      paths.map(async (path) => {
        const revalidateUrl = new URL('/api/revalidate-product', baseUrl)
        
        const response = await fetch(revalidateUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(revalidateSecret && { 'Authorization': `Bearer ${revalidateSecret}` })
          },
          body: JSON.stringify({ path })
        })

        if (!response.ok) {
          throw new Error(`Failed to revalidate ${path}: ${response.statusText}`)
        }

        return { path, success: true }
      })
    )

    const successes = results.filter(r => r.status === 'fulfilled').length
    const failures = results.filter(r => r.status === 'rejected')

    if (failures.length > 0) {
      console.warn('Some revalidations failed:', failures)
    }

    console.log(`Revalidated ${successes}/${paths.length} paths successfully`)

    return {
      success: successes > 0,
      total: paths.length,
      successful: successes,
      failed: failures.length,
      results
    }
  } catch (error) {
    console.error('Revalidation error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Revalidate product-related pages
 */
export async function revalidateProduct(productId: string, productSlug?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL

  if (!baseUrl) {
    console.error('NEXT_PUBLIC_PAYMENT_SERVER_URL not configured')
    return { success: false, error: 'Base URL not configured' }
  }

  const revalidateSecret = process.env.PAYMENT_SERVER_API_KEY

  try {
    const revalidateUrl = new URL('/api/revalidate-product', baseUrl)
    
    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(revalidateSecret && { 'Authorization': `Bearer ${revalidateSecret}` })
      },
      body: JSON.stringify({ productId })
    })

    if (!response.ok) {
      throw new Error(`Failed to revalidate product ${productId}: ${response.statusText}`)
    }

    console.log(`Successfully revalidated product: ${productId}`)

    return {
      success: true,
      productId,
      results: [{ productId, success: true }]
    }
  } catch (error) {
    console.error('Product revalidation error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      productId 
    }
  }
}

/**
 * Revalidate variant-related pages (includes product page)
 */
export async function revalidateVariant(productId: string, variantId: string, productSlug?: string) {
  // For variants, we still revalidate the product since variants are part of the product page
  return revalidateProduct(productId, productSlug)
}