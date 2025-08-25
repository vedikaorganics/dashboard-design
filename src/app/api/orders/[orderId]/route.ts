import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { cache } from '@/lib/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `order:${orderId}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const ordersCollection = await getCollection('orders')
    const usersCollection = await getCollection('users')
    const productsCollection = await getCollection('products')
    const variantsCollection = await getCollection('productVariants')

    // Find the order
    const order = await ordersCollection.findOne({ orderId })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get user data
    const user = await usersCollection.findOne({ 
      $or: [
        { _id: new ObjectId(order.userId) },
        { userId: order.userId }
      ]
    })

    // Get product and variant data for order items
    const variantIds = order.items?.map((item: any) => item.variant) || []
    const [variants, products] = await Promise.all([
      variantsCollection
        .find({ id: { $in: variantIds } })
        .toArray(),
      productsCollection
        .find({})
        .toArray()
    ])

    // Create maps for quick lookup
    const variantMap = variants.reduce((acc: any, variant: any) => {
      acc[variant.id] = variant
      return acc
    }, {})

    const productMap = products.reduce((acc: any, product: any) => {
      acc[product.id] = product
      return acc
    }, {})

    // Enrich order items with product and variant data
    const enrichedItems = order.items?.map((item: any) => {
      const variant = variantMap[item.variant]
      const product = variant ? productMap[variant.productId] : null
      
      return {
        ...item,
        variantData: variant,
        productData: product
      }
    }) || []

    const result = {
      ...order,
      user,
      items: enrichedItems
    }

    // Cache for 5 minutes (individual orders don't change as frequently)
    cache.set(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Order detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}