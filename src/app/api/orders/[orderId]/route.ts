import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { cache } from '@/lib/cache'
import { limechatService } from '@/lib/limechat'

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
    const cacheKey = `order-${orderId}`
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const { deliveryStatus } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    if (!deliveryStatus) {
      return NextResponse.json(
        { error: 'Delivery status is required' },
        { status: 400 }
      )
    }

    // Validate delivery status
    const validStatuses = ['PENDING', 'PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(deliveryStatus)) {
      return NextResponse.json(
        { error: 'Invalid delivery status' },
        { status: 400 }
      )
    }

    const ordersCollection = await getCollection('orders')

    // Update the order
    const result = await ordersCollection.updateOne(
      { orderId },
      { 
        $set: { 
          deliveryStatus,
          updatedAt: new Date().toISOString()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Get the updated order and user data for LimeChat events
    const [updatedOrder, usersCollection] = await Promise.all([
      ordersCollection.findOne({ orderId }),
      getCollection('users')
    ])

    // Send LimeChat event asynchronously if order is dispatched or delivered (non-blocking)
    if (deliveryStatus === 'DISPATCHED' || deliveryStatus === 'DELIVERED') {
      setImmediate(async () => {
        try {
          if (updatedOrder && updatedOrder.userId) {
            const user = await usersCollection.findOne({ 
              $or: [
                { _id: new ObjectId(updatedOrder.userId) },
                { userId: updatedOrder.userId }
              ]
            })
            
            if (user && user.phoneNumber) {
              const phoneAsDistinctId = user.phoneNumber.startsWith('+') 
                ? user.phoneNumber.substring(1) 
                : user.phoneNumber;
              
              // Get product info from first item
              const firstItem = updatedOrder.items?.[0];
              const productName = firstItem?.title || '';
              const coverImage = firstItem?.image || '';
              
              const eventName = deliveryStatus === 'DISPATCHED' ? 'order_shipped' : 'order_delivered';
              
              limechatService.sendShippingEvent(
                eventName,
                updatedOrder.orderId,
                updatedOrder.amount || updatedOrder.totalAmount || 0,
                productName,
                coverImage,
                updatedOrder.waybill || '',
                user.phoneNumber,
                phoneAsDistinctId,
                user.name || ''
              );
            }
          }
        } catch (error) {
          // Log error but don't fail the API call
          console.error(`Failed to send LimeChat ${deliveryStatus.toLowerCase()} event for order ${orderId}:`, error);
        }
      });
    }

    // Clear related caches
    cache.delete(`order-${orderId}`)
    // Clear orders list cache
    const cacheKeys = ['orders-', 'dashboard-overview']
    cacheKeys.forEach(keyPrefix => {
      const allKeys = cache.getStats?.()?.keys || []
      allKeys.forEach(key => {
        if (key.startsWith(keyPrefix)) {
          cache.delete(key)
        }
      })
    })

    return NextResponse.json({ 
      success: true, 
      deliveryStatus,
      message: 'Delivery status updated successfully'
    })
  } catch (error) {
    console.error('Order update API error:', error)
    return NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    )
  }
}