"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Star, AlertCircle, Clock, CheckCircle, Truck } from "lucide-react"
import { BarChart } from "@/components/charts"
import { useDashboard, useOrders, useReviews, usePrefetch } from "@/hooks/use-data"
import Link from "next/link"
import { Area, AreaChart as RechartsAreaChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"



const getStatusBadge = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
    case 'PENDING':
      return <Badge className="bg-warning/20 text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'DELIVERED':
      return <Badge className="bg-info/20 text-info"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getPaymentStatusBadge = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'PAID':
      return <Badge className="bg-success/20 text-success">Paid</Badge>
    case 'CASH_ON_DELIVERY':
      return <Badge className="bg-success/20 text-success">COD</Badge>
    case 'PENDING':
      return <Badge className="bg-warning/20 text-warning">Pending</Badge>
    case 'FAILED':
      return <Badge className="bg-destructive/20 text-destructive">Failed</Badge>
    default:
      return <Badge variant="outline">{paymentStatus}</Badge>
  }
}

// Helper function to render growth indicator
const getGrowthIndicator = (growth: number) => {
  const isPositive = growth >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  const colorClass = isPositive ? "text-success" : "text-destructive"
  
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
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
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
  const ordersToShip = data?.ordersToShip || 0
  const dailyRevenueChart = data?.dailyRevenueChart || [
    // Fallback data if API data is not available
    { name: 'Loading...', mrr: 0 }
  ]
  
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
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-3"
                  asChild
                  onMouseEnter={() => handlePrefetch('orders')}
                >
                  <Link href="/orders?filter=ready_to_ship" className="flex items-center space-x-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Orders to Ship</div>
                      <div className="text-sm text-muted-foreground">{ordersToShip} confirmed orders ready for shipping</div>
                    </div>
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-3"
                  asChild
                >
                  <Link href="/reviews?filter=unapproved" className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Review Moderation</div>
                      <div className="text-sm text-muted-foreground">{pendingReviews > 0 ? `${pendingReviews} reviews need approval` : 'All reviews approved'}</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Recurring Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                mrr: {
                  label: "MRR",
                  color: "var(--primary)",
                },
              }}
              className="h-[350px] aspect-auto"
            >
              <RechartsAreaChart data={dailyRevenueChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    // Format as MM/YY if it looks like a date string
                    try {
                      const date = new Date(value);
                      if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' });
                      }
                      return value.slice(0, 3);
                    } catch {
                      return value.slice(0, 3);
                    }
                  }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `₹${((Number(value) * 30) / 100000).toFixed(1)}L`}
                />
                <ChartTooltip 
                  cursor={false}
                  content={<ChartTooltipContent 
                    indicator="dot" 
                    labelFormatter={(label) => {
                      // Show x-axis value in tooltip
                      try {
                        const date = new Date(label);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' });
                        }
                        return label;
                      } catch {
                        return label;
                      }
                    }}
                    formatter={(value) => [`₹${((Number(value) * 30) / 100000).toFixed(2)}L`]}
                  />}
                />
                <Area 
                  dataKey="mrr"
                  type="monotone"
                  fill="var(--color-mrr)"
                  fillOpacity={0.3}
                  stroke="var(--color-mrr)"
                  strokeWidth={3}
                />
              </RechartsAreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <BarChart
            title="Customer Order Distribution"
            description="Number of customers by order count"
            data={customerOrderDistributionData}
            height={350}
          />
          
          <BarChart
            title="Orders by Amount Range"
            description="Distribution of orders by price range (₹500 intervals)"
            data={data?.orderAmountRangeData || []}
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
                          <Star key={i} className="w-3 h-3 fill-warning text-warning" />
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