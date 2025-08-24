"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, ShoppingCart, Package, DollarSign, Star, AlertCircle, Clock, CheckCircle } from "lucide-react"
import { AreaChart, LineChart, BarChart, PieChart } from "@/components/charts"
import { useDashboard, useOrders, useReviews, usePrefetch } from "@/hooks/use-data"
import Link from "next/link"

const revenueData = [
  { name: 'Jan', value: 89000 },
  { name: 'Feb', value: 95000 },
  { name: 'Mar', value: 112000 },
  { name: 'Apr', value: 128000 },
  { name: 'May', value: 134000 },
  { name: 'Jun', value: 156000 },
]

const productSalesData = [
  { name: 'Mustard Oil', value: 45 },
  { name: 'Sesame Oil', value: 30 },
  { name: 'Groundnut Oil', value: 20 },
  { name: 'Coconut Oil', value: 5 },
]


const utmData = [
  { name: 'WhatsApp Calls', value: 8500 },
  { name: 'Google Ads', value: 6200 },
  { name: 'Facebook', value: 4100 },
  { name: 'Direct', value: 3200 },
  { name: 'Instagram', value: 2800 },
  { name: 'Referral', value: 1900 },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'DELIVERED':
      return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getPaymentStatusBadge = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'PAID':
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>
    case 'CASH_ON_DELIVERY':
      return <Badge className="bg-green-100 text-green-800">COD</Badge>
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    case 'FAILED':
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    default:
      return <Badge variant="outline">{paymentStatus}</Badge>
  }
}

// Helper function to render growth indicator
const getGrowthIndicator = (growth: number) => {
  const isPositive = growth >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  const colorClass = isPositive ? "text-green-500" : "text-red-500"
  
  return (
    <div className={`flex items-center space-x-1 text-xs ${colorClass}`}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(growth).toFixed(1)}%</span>
    </div>
  )
}

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useDashboard()
  const { data: recentOrdersData } = useOrders(1, 10)
  const { data: reviewsData } = useReviews(1, 3)
  const { prefetchOrders, prefetchProducts, prefetchUsers } = usePrefetch()
  
  // Prefetch data for better UX
  const handlePrefetch = (type: string) => {
    switch (type) {
      case 'orders': prefetchOrders(); break;
      case 'products': prefetchProducts(); break;
      case 'users': prefetchUsers(); break;
    }
  }
  
  // Show loading skeleton if no cached data
  if (isLoading && !dashboardData) {
    return (
      <DashboardLayout title="Overview">
        <div className="flex-1 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                  <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }
  
  // Use cached data or fallback values
  const data = dashboardData as any
  const totalRevenue = data?.totalRevenue || 0
  const revenueGrowth = data?.revenueGrowth || 0
  const totalOrders = data?.totalOrders || 0
  const ordersGrowth = data?.ordersGrowth || 0
  const totalUsers = data?.totalUsers || 0
  const usersGrowth = data?.usersGrowth || 0
  const totalReviews = data?.totalReviews || 0
  const reviewsGrowth = data?.reviewsGrowth || 0
  const confirmedOrders = data?.confirmedOrders || 0
  const pendingOrders = data?.pendingOrders || 0
  const averageRating = data?.averageRating || 0
  const pendingReviews = data?.pendingReviews || 0
  const customerOrderDistributionData = data?.customerOrderDistributionData || []
  
  return (
    <DashboardLayout title="Overview">
      <div className="flex-1 space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">₹{(totalRevenue / 100000).toFixed(2)}L</div>
                {getGrowthIndicator(revenueGrowth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{(totalOrders / 1000).toFixed(2)}K</div>
                {getGrowthIndicator(ordersGrowth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{(totalUsers / 1000).toFixed(2)}K</div>
                {getGrowthIndicator(usersGrowth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-x-2 space-y-0 pb-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{totalReviews}</div>
                {getGrowthIndicator(reviewsGrowth)}
              </div>
            </CardContent>
          </Card>
          
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/orders">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(recentOrdersData as any)?.orders?.slice(0, 5).map((order: any) => {
                  const customerName = order.address.firstName + (order.address.lastName ? ` ${order.address.lastName}` : '')
                  
                  return (
                    <div key={order._id} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground font-mono">#{order.orderId}</span>
                          <p className="text-sm font-medium leading-none">
                            {customerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const orderDate = new Date(order.createdAt)
                              const today = new Date()
                              const isToday = orderDate.toDateString() === today.toDateString()
                              
                              if (isToday) {
                                return orderDate.toLocaleString('en-IN', { 
                                  timeZone: 'Asia/Kolkata',
                                  hour12: true,
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              } else {
                                return orderDate.toLocaleString('en-IN', { 
                                  timeZone: 'Asia/Kolkata',
                                  hour12: true,
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPaymentStatusBadge(order.paymentStatus)}
                        <div className="font-medium text-right">
                          <div>₹{order.amount.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  )
                }) || (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-48"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-6 bg-muted animate-pulse rounded w-16"></div>
                          <div className="h-4 bg-muted animate-pulse rounded w-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  asChild 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onMouseEnter={() => handlePrefetch('orders')}
                >
                  <Link href="/orders">
                    <ShoppingCart className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Manage Orders</div>
                      <div className="text-sm text-muted-foreground">{pendingOrders} pending orders</div>
                    </div>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onMouseEnter={() => handlePrefetch('products')}
                >
                  <Link href="/products">
                    <Package className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Products</div>
                      <div className="text-sm text-muted-foreground">Oil product catalog</div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start h-auto p-4">
                  <Link href="/reviews">
                    <Star className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Reviews</div>
                      <div className="text-sm text-muted-foreground">{pendingReviews > 0 ? `${pendingReviews} to moderate` : 'All up to date'}</div>
                    </div>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="justify-start h-auto p-4"
                  onMouseEnter={() => handlePrefetch('users')}
                >
                  <Link href="/users">
                    <Users className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Customers</div>
                      <div className="text-sm text-muted-foreground">{totalUsers} registered</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <AreaChart
            title="Revenue Trend"
            description="Monthly revenue from oil sales (₹)"
            data={revenueData}
            height={350}
          />
          
          <BarChart
            title="Customer Order Distribution"
            description="Number of customers by order count"
            data={customerOrderDistributionData}
            height={350}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <PieChart
            title="Sales by Product Type"
            description="Breakdown by oil varieties"
            data={productSalesData}
            height={350}
          />
          
          <LineChart
            title="Marketing Campaign Performance"
            description="Revenue by UTM source (₹)"
            data={utmData}
            height={350}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Customer Reviews</CardTitle>
            <CardDescription>Latest feedback from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(reviewsData as any)?.reviews?.slice(0, 3).map((review: any) => (
                <div key={review._id} className="flex items-start space-x-4 pb-4 border-b last:border-0">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{review.author}</p>
                      <div className="flex">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      {!review.isApproved && (
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.product?.title}</p>
                    <p className="text-sm">{review.text}</p>
                    {review.photos?.length > 0 && (
                      <p className="text-xs text-muted-foreground">📸 {review.photos.length} photo{review.photos.length > 1 ? 's' : ''} attached</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )) || (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-4 pb-4 border-b last:border-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                          <div className="h-4 bg-muted animate-pulse rounded w-16"></div>
                        </div>
                        <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
                        <div className="h-3 bg-muted animate-pulse rounded w-full"></div>
                      </div>
                      <div className="h-3 bg-muted animate-pulse rounded w-16"></div>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/reviews">View All Reviews</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}