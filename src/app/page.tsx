"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, AlertCircle, Clock, CheckCircle, Truck, Star, Package } from "lucide-react"
import { BarChart } from "@/components/charts"
import { useDashboard, useOrders, useReviews, usePrefetch } from "@/hooks/use-data"
import Link from "next/link"
import { Area, AreaChart as RechartsAreaChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelativeDateTime } from "@/lib/utils"



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
      return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
    case 'CASH_ON_DELIVERY':
      return <Badge className="bg-info/20 text-info"><CheckCircle className="w-3 h-3 mr-1" />COD</Badge>
    case 'PENDING':
      return <Badge className="bg-warning/20 text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'FAILED':
      return <Badge className="bg-destructive/20 text-destructive">Failed</Badge>
    default:
      return <Badge variant="outline">{paymentStatus}</Badge>
  }
}

const getDeliveryStatusBadge = (deliveryStatus: string) => {
  switch (deliveryStatus) {
    case 'PENDING':
      return <Badge className="border-border text-muted-foreground bg-muted/10"><Package className="w-3 h-3 mr-1" />Pending</Badge>
    case 'PREPARING':
      return <Badge className="bg-warning/20 text-warning border-warning/30"><Package className="w-3 h-3 mr-1" />Preparing</Badge>
    case 'DISPATCHED':
      return <Badge className="bg-info/20 text-info border-info/30"><Truck className="w-3 h-3 mr-1" />Dispatched</Badge>
    case 'DELIVERED':
      return <Badge className="bg-success/20 text-success border-success/30"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
    case 'CANCELLED':
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30"><Package className="w-3 h-3 mr-1" />Cancelled</Badge>
    default:
      return <Badge variant="outline">{deliveryStatus}</Badge>
  }
}

// Helper function to render growth indicator
const getGrowthIndicator = (growth: number) => {
  const isPositive = growth >= 0
  const Icon = isPositive ? TrendingUp : TrendingDown
  const colorClass = isPositive ? "text-success" : "text-destructive"
  
  return (
    <div className={`flex items-center space-x-1 text-sm ${colorClass}`}>
      <Icon className="h-4 w-4" />
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
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">₹{(totalRevenue / 100000).toFixed(2)}L</div>
                {getGrowthIndicator(revenueGrowth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{(totalOrders / 1000).toFixed(2)}K</div>
                {getGrowthIndicator(ordersGrowth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{(totalUsers / 1000).toFixed(2)}K</div>
                {getGrowthIndicator(usersGrowth)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{totalReviews}</div>
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
                  const timestamp = order.time || order.createdAt
                  const { time, relativeDate } = formatRelativeDateTime(timestamp)
                  
                  return (
                    <div key={order._id} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-muted-foreground font-mono">#{order.orderId}</span>
                          <p className="text-sm font-medium leading-none">
                            {customerName}
                          </p>
                          <div className="text-xs">
                            <span className="font-mono">{time}</span>
                            <span className="text-muted-foreground">, {relativeDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getPaymentStatusBadge(order.paymentStatus)}
                        {(order.paymentStatus === 'CASH_ON_DELIVERY' || order.paymentStatus === 'PAID') && 
                          getDeliveryStatusBadge(order.deliveryStatus)
                        }
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
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Recurring Revenue</CardTitle>
              <div className="flex items-center space-x-6">
                {(() => {
                  const latestData = dailyRevenueChart[dailyRevenueChart.length - 1]
                  if (!latestData) return null
                  
                  const currentTotal = ((latestData.mrr * 30) / 100000).toFixed(2)
                  const currentRepeat = ((latestData.repeatCustomerMrr * 30) / 100000).toFixed(2)
                  const currentNew = ((latestData.newCustomerMrr * 30) / 100000).toFixed(2)
                  
                  return (
                    <>
                      <div className="text-center">
                        <div className="text-lg font-bold">₹{currentTotal}L</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#10b981]">₹{currentRepeat}L</div>
                        <div className="text-sm text-muted-foreground">Repeat</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#f59e0b]">₹{currentNew}L</div>
                        <div className="text-sm text-muted-foreground">New</div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                mrr: {
                  label: "Total MRR",
                  color: "var(--primary)",
                },
                newCustomerMrr: {
                  label: "New Customers",
                  color: "hsl(var(--chart-2))",
                },
                repeatCustomerMrr: {
                  label: "Repeat Customers",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[350px] aspect-auto"
            >
              <ComposedChart data={dailyRevenueChart}>
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
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null
                    
                    const data = payload[0].payload
                    const totalMrr = ((data.mrr * 30) / 100000).toFixed(2)
                    const newMrr = ((data.newCustomerMrr * 30) / 100000).toFixed(2)
                    const repeatMrr = ((data.repeatCustomerMrr * 30) / 100000).toFixed(2)
                    
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <p className="text-sm font-medium mb-2">{label}</p>
                        <div className="space-y-1 font-mono">
                          <p className="text-sm">₹{totalMrr}L Mrr</p>
                          <p className="text-sm">₹{repeatMrr}L Repeat</p>
                          <p className="text-sm">₹{newMrr}L New</p>
                        </div>
                      </div>
                    )
                  }}
                />
                <Area 
                  dataKey="mrr"
                  type="monotone"
                  fill="var(--color-mrr)"
                  fillOpacity={0.2}
                  stroke="var(--color-mrr)"
                  strokeWidth={3}
                />
                <Line 
                  dataKey="newCustomerMrr"
                  type="monotone"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                />
                <Line 
                  dataKey="repeatCustomerMrr"
                  type="monotone"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
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

      </div>
    </DashboardLayout>
  )
}