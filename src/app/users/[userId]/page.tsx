"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, ShoppingBag, Star, TrendingUp, Gift, Save, X, ExternalLink, Package, CreditCard, Truck } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { 
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from "@/components/ui/breadcrumb"
import { PieChart } from "@/components/charts"
import { useUserDetails } from "@/hooks/use-data"
import type { User as UserType, Order } from "@/types"

interface UserDetailPageProps {
  params: Promise<{
    userId: string
  }>
}

const getVerificationBadge = (verified: boolean) => {
  return verified ? (
    <Badge className="bg-success/20 text-success">
      Verified
    </Badge>
  ) : (
    <Badge className="bg-destructive/20 text-destructive">
      Unverified
    </Badge>
  )
}

const getPaymentStatusBadge = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'PAID':
      return <Badge className="bg-success/20 text-success"><CreditCard className="w-3 h-3 mr-1" />Paid</Badge>
    case 'CASH_ON_DELIVERY':
      return <Badge className="bg-success/20 text-success"><CreditCard className="w-3 h-3 mr-1" />COD</Badge>
    case 'PENDING':
      return <Badge className="bg-warning/20 text-warning"><CreditCard className="w-3 h-3 mr-1" />Pending</Badge>
    case 'FAILED':
      return <Badge className="bg-destructive/20 text-destructive">Failed</Badge>
    default:
      return <Badge variant="outline">{paymentStatus}</Badge>
  }
}

const getDeliveryStatusBadge = (deliveryStatus: string) => {
  switch (deliveryStatus) {
    case 'PENDING':
      return <Badge variant="outline"><Package className="w-3 h-3 mr-1" />Pending</Badge>
    case 'PREPARING':
      return <Badge className="bg-warning/20 text-warning"><Package className="w-3 h-3 mr-1" />Preparing</Badge>
    case 'DISPATCHED':
      return <Badge className="bg-info/20 text-info"><Truck className="w-3 h-3 mr-1" />Dispatched</Badge>
    case 'DELIVERED':
      return <Badge className="bg-success/20 text-success"><Package className="w-3 h-3 mr-1" />Delivered</Badge>
    case 'CANCELLED':
      return <Badge className="bg-destructive/20 text-destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{deliveryStatus}</Badge>
  }
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const resolvedParams = React.use(params)
  const { userId } = resolvedParams
  
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  
  // Fetch user details with orders, reviews, and rewards
  const { data: userData, isLoading, error, mutate } = useUserDetails(userId, {
    includeOrders: true,
    includeReviews: true,
    includeRewards: true
  })
  
  const user = userData as UserType & { 
    totalSpent: number; 
    averageOrderValue: number; 
    customerRank: string;
    rewardsPoints: number;
    orders?: Order[];
    reviews?: any[];
    rewards?: any[];
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Customer Details">
        <div className="flex-1 space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-muted rounded mb-6"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !user) {
    return (
      <DashboardLayout title="Customer Details">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
            <Button asChild>
              <Link href="/users">Back to Customers</Link>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const handleEditNote = () => {
    setEditingNote(true)
    setNoteText(user.notes || '')
  }

  const handleSaveNote = async () => {
    setIsSavingNote(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: noteText })
      })
      
      if (response.ok) {
        // Update local state and exit edit mode
        setEditingNote(false)
        // Refresh user data
        mutate()
      }
    } catch (error) {
      console.error('Failed to update note:', error)
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingNote(false)
    setNoteText('')
  }


  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('') : user.phoneNumber.slice(-2)

  return (
    <DashboardLayout title="Customer Details">
      <div className="flex-1 space-y-6">
        {/* Breadcrumb */}
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
                <Link href="/users">Customers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{user.name || user.phoneNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hero Section */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={user.name || 'User avatar'} />
                  )}
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold">{user.name || 'Unnamed Customer'}</h1>
                    {getVerificationBadge(user.phoneNumberVerified)}
                  </div>
                  <div className="flex items-center space-x-4 text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{user.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{user.email && !user.email.includes('@temp.local') ? user.email : '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{user.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.noOfOrders}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ₹{user.averageOrderValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Points</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.rewardsPoints}</div>
              <p className="text-xs text-muted-foreground">
                ₹{Math.floor(user.rewardsPoints * 0.5)} value
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {user.lastOrderedOn ? new Date(user.lastOrderedOn).toLocaleDateString() : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.lastOrderedOn && `${Math.floor((Date.now() - new Date(user.lastOrderedOn).getTime()) / (1000 * 60 * 60 * 24))} days ago`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>
          
          
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Complete order history for this customer ({user.orders?.length || 0} orders)
                </div>
              </CardHeader>
              <CardContent>
                {user.orders && user.orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.orders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell>
                            <Link 
                              href={`/orders/${order.orderId}`}
                              className="font-medium hover:text-primary flex items-center gap-1"
                            >
                              #{order.orderId}
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </Link>
                          </TableCell>
                          <TableCell>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {order.items?.length || 0} items
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">₹{order.amount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(order.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {getDeliveryStatusBadge(order.deliveryStatus)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order.orderId}`}>
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders found for this customer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Feedback</CardTitle>
                <div className="text-sm text-muted-foreground">
                  All reviews submitted by this customer ({user.reviews?.length || 0} reviews)
                </div>
              </CardHeader>
              <CardContent>
                {user.reviews && user.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {user.reviews.map((review) => (
                      <div key={review._id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium">{review.product || 'Product'}</div>
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="text-sm text-muted-foreground ml-2">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={review.isApproved ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}>
                              {review.isApproved ? 'Approved' : 'Pending'}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {review.text && (
                          <p className="text-sm text-muted-foreground mt-2">{review.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews submitted by this customer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rewards">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Current Offers */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Offers</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Current offers for this customer
                  </div>
                </CardHeader>
                <CardContent>
                  {user.offers && user.offers.length > 0 ? (
                    <div className="space-y-2">
                      {user.offers.map((offer, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Gift className="h-4 w-4 text-primary" />
                            <span className="font-medium">{offer}</span>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active offers</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rewards History */}
              <Card>
                <CardHeader>
                  <CardTitle>Rewards History</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Points earned and redeemed ({user.rewards?.length || 0} transactions)
                  </div>
                </CardHeader>
                <CardContent>
                  {user.rewards && user.rewards.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                        <span className="font-medium">Available Points</span>
                        <span className="text-lg font-bold text-primary">{user.rewardsPoints}</span>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {user.rewards.slice(0, 10).map((reward) => (
                          <div key={reward._id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="text-sm font-medium">
                                {reward.sourceType === 'ORDER' ? 'Order Reward' : reward.sourceType}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(reward.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${reward.isClaimed ? 'text-muted-foreground' : 'text-primary'}`}>
                                +{reward.rewardValue} pts
                              </div>
                              <Badge variant={reward.isClaimed ? 'secondary' : 'default'} className="text-xs">
                                {reward.isClaimed ? 'Used' : 'Available'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No rewards history</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
        </Tabs>
      </div>
    </DashboardLayout>
  )
}