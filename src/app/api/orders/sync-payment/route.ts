import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { cache } from '@/lib/cache'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Validate session for security
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const ordersCollection = await getCollection('orders')

    // Get the specific order
    const order = await ordersCollection.findOne({ orderId })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentStatus !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Order payment status is not pending',
        currentStatus: order.paymentStatus 
      }, { status: 400 })
    }

    try {
      // Call the payment server sync endpoint for this order
      const syncResponse = await fetch(
        `${process.env.PAYMENT_SERVER_URL}/api/admin/orders/${orderId}/sync-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PAYMENT_SERVER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!syncResponse.ok) {
        const errorText = await syncResponse.text()
        throw new Error(`Payment server error: ${errorText}`)
      }

      const syncResult = await syncResponse.json()

      // Clear cache to force refresh of orders data
      cache.clear()

      return NextResponse.json({
        message: 'Payment status synced successfully',
        orderId,
        previousStatus: order.paymentStatus,
        newStatus: syncResult.paymentStatus || order.paymentStatus,
        syncResult
      })

    } catch (error) {
      console.error('Payment sync error for order:', orderId, error)
      return NextResponse.json({
        error: 'Failed to sync payment status',
        orderId,
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Payment sync API error:', error)
    return NextResponse.json(
      { error: 'Failed to sync payment status' },
      { status: 500 }
    )
  }
}