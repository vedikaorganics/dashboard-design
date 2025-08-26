"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Package, User, CreditCard, Truck, MapPin, BarChart3 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb"
import { useOrder } from "@/hooks/use-data"
import type { Order } from "@/types"

interface OrderDetailPageProps {
  params: Promise<{
    orderId: string
  }>
}

const getDeliveryStatusBadge = (deliveryStatus: string) => {
  switch (deliveryStatus) {
    case 'PENDING':
      return <Badge variant="outline"><Package className="w-3 h-3 mr-1" />Pending</Badge>
    case 'SHIPPED':
      return <Badge className="bg-info/20 text-info"><Truck className="w-3 h-3 mr-1" />Shipped</Badge>
    case 'DELIVERED':
      return <Badge className="bg-success/20 text-success"><Package className="w-3 h-3 mr-1" />Delivered</Badge>
    default:
      return <Badge variant="outline">{deliveryStatus}</Badge>
  }
}

const getPaymentStatusBadge = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'PAID':
      return <Badge className="bg-success/20 text-success"><CreditCard className="w-3 h-3 mr-1" />Paid</Badge>
    case 'CASH_ON_DELIVERY':
      return <Badge className="bg-success/20 text-success"><CreditCard className="w-3 h-3 mr-1" />COD</Badge>
    case 'PENDING':
      return <Badge className="bg-warning/10 text-warning border-warning/30"><CreditCard className="w-3 h-3 mr-1" />Pending</Badge>
    case 'FAILED':
      return <Badge className="bg-destructive/20 text-destructive">Failed</Badge>
    default:
      return <Badge variant="outline">{paymentStatus}</Badge>
  }
}

const getOrderStatusBadge = (orderStatus: string) => {
  switch (orderStatus) {
    case 'CONFIRMED':
      return <Badge className="bg-success/20 text-success">Confirmed</Badge>
    case 'PENDING':
      return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>
    case 'DELIVERED':
      return <Badge className="bg-success/20 text-success">Delivered</Badge>
    case 'CANCELLED':
      return <Badge className="bg-destructive/20 text-destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{orderStatus}</Badge>
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()
  const resolvedParams = React.use(params)
  const { orderId } = resolvedParams
  
  const { data: orderData, isLoading, error } = useOrder(orderId)
  
  if (isLoading) {
    return (
      <DashboardLayout title="Order Details">
        <div className="flex-1 space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/orders">Orders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Loading...</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !orderData) {
    return (
      <DashboardLayout title="Order Details">
        <div className="flex-1 space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/orders">Orders</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Not Found</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Order Details</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Order not found</p>
                <p className="text-muted-foreground">The order you're looking for doesn't exist or has been removed.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const order = orderData as Order & { user: any }
  const customerName = `${order.address.firstName} ${order.address.lastName || ''}`.trim()

  return (
    <DashboardLayout title={`Order #${order.orderId}`}>
      <div className="flex-1 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/orders">Orders</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>#{order.orderId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header with Back Button */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order #{order.orderId}</h1>
            <p className="text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Order Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Status</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getOrderStatusBadge(order.orderStatus)}
                <p className="text-xs text-muted-foreground">Current order status</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getPaymentStatusBadge(order.paymentStatus)}
                <p className="text-xs text-muted-foreground">
                  {order.cashOnDelivery ? 'Cash on Delivery' : 'Online Payment'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getDeliveryStatusBadge(order.deliveryStatus)}
                <p className="text-xs text-muted-foreground">Delivery status</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-lg">{customerName}</p>
                <p className="text-muted-foreground">{order.address.email}</p>
                <p className="text-muted-foreground">{order.address.mobileNumber}</p>
                {order.address.alternateMobileNumber && (
                  <p className="text-muted-foreground text-sm">Alt: {order.address.alternateMobileNumber}</p>
                )}
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{order.address.addressLine1}</p>
                  {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                  {order.address.landmark && <p>Near: {order.address.landmark}</p>}
                  <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                  <p>{order.address.country}</p>
                </div>
              </div>

              {order.user?.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="font-medium mb-1">Customer Notes</p>
                    <p className="text-sm text-muted-foreground">{order.user.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    {item.variantData?.coverImage && (
                      <img
                        src={item.variantData.coverImage}
                        alt={item.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.variantData?.title} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                    </div>
                  </div>
                )) || <p className="text-muted-foreground">No items found</p>}

                <Separator />

                <div className="space-y-2">
                  {order.offers && order.offers.length > 0 && (
                    <>
                      {order.offers.map((offer: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-success">Discount: {offer.title}</span>
                          <span className="text-success">-₹{offer.discount.toLocaleString()}</span>
                        </div>
                      ))}
                      <Separator />
                    </>
                  )}
                  
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total Amount</span>
                    <span>₹{(order.amount || (order as any).totalAmount || 0).toLocaleString()}</span>
                  </div>

                  {order.rewards > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Rewards Earned</span>
                      <span>+{order.rewards} points</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marketing Analytics */}
          {order.utmParams && order.utmParams.utm_source && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Marketing Attribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Source</p>
                    <p className="text-muted-foreground">{order.utmParams.utm_source}</p>
                  </div>
                  {order.utmParams.utm_medium && (
                    <div>
                      <p className="font-medium">Medium</p>
                      <p className="text-muted-foreground">{order.utmParams.utm_medium}</p>
                    </div>
                  )}
                  {order.utmParams.utm_campaign && (
                    <div>
                      <p className="font-medium">Campaign</p>
                      <p className="text-muted-foreground">{order.utmParams.utm_campaign}</p>
                    </div>
                  )}
                  {order.utmParams.utm_term && (
                    <div>
                      <p className="font-medium">Term</p>
                      <p className="text-muted-foreground">{order.utmParams.utm_term}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details */}
          {order.razorpayOrder && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Payment ID</p>
                    <p className="text-muted-foreground font-mono text-xs">{order.razorpayOrder.id}</p>
                  </div>
                  <div>
                    <p className="font-medium">Receipt</p>
                    <p className="text-muted-foreground">{order.razorpayOrder.receipt}</p>
                  </div>
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-muted-foreground">{order.razorpayOrder.status}</p>
                  </div>
                  <div>
                    <p className="font-medium">Currency</p>
                    <p className="text-muted-foreground">{order.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}