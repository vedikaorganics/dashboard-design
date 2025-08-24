"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Filter, Eye, CheckCircle, Clock, Truck, Package, Phone, MapPin, CreditCard, Gift } from "lucide-react"
import { useOrders } from "@/hooks/use-data"
import type { Order } from "@/types"


const getOrderStatusBadge = (orderStatus: string) => {
  switch (orderStatus) {
    case 'CONFIRMED':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'DELIVERED':
      return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
    case 'CANCELLED':
      return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
    default:
      return <Badge variant="outline">{orderStatus}</Badge>
  }
}

const getDeliveryStatusBadge = (deliveryStatus: string) => {
  switch (deliveryStatus) {
    case 'PENDING':
      return <Badge variant="outline"><Package className="w-3 h-3 mr-1" />Pending</Badge>
    case 'SHIPPED':
      return <Badge className="bg-blue-100 text-blue-800"><Truck className="w-3 h-3 mr-1" />Shipped</Badge>
    case 'DELIVERED':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
    default:
      return <Badge variant="outline">{deliveryStatus}</Badge>
  }
}

const getPaymentStatusBadge = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'PAID':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
    case 'CASH_ON_DELIVERY':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />COD</Badge>
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'FAILED':
      return <Badge className="bg-red-100 text-red-800">Failed</Badge>
    default:
      return <Badge variant="outline">{paymentStatus}</Badge>
  }
}

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  const { data: ordersData, isLoading } = useOrders(currentPage, 50, statusFilter === "all" ? undefined : statusFilter)
  
  const orders = (ordersData as any)?.orders || []
  const pagination = (ordersData as any)?.pagination || {}
  
  const filteredOrders = orders.filter((order: any) => {
    if (!searchTerm) return true
    const matchesSearch = order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.address?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.address?.mobileNumber?.includes(searchTerm)
    return matchesSearch
  })
  
  const getCustomerName = (order: Order) => {
    return order.address.firstName + (order.address.lastName ? ` ${order.address.lastName}` : '')
  }
  
  return (
    <DashboardLayout title="Orders Management">
      <div className="flex-1 space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination?.total || 0}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.filter((o: any) => o.orderStatus === 'PENDING').length}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.filter((o: any) => o.paymentStatus === 'PAID' || o.paymentStatus === 'CASH_ON_DELIVERY').length}</div>
              <p className="text-xs text-muted-foreground">Ready to ship</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.filter((o: any) => o.orderStatus === 'DELIVERED').length}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>
              Manage orders from your oil store. Track payments, deliveries, and customer details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by order ID, customer name, or phone..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Order Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const customerName = getCustomerName(order)
                      return (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">#{order.orderId}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{customerName}</div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {order.address.mobileNumber}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {order.address.city}, {order.address.state}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium">
                                {order.items[0]?.title.split('(')[0].trim()}
                              </div>
                              {order.items.length > 1 && (
                                <div className="text-sm text-muted-foreground">
                                  +{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Qty: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getOrderStatusBadge(order.orderStatus)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getPaymentStatusBadge(order.paymentStatus)}
                              <div className="text-xs text-muted-foreground flex items-center">
                                {order.cashOnDelivery ? (
                                  <>Cash on Delivery</>
                                ) : (
                                  <><CreditCard className="w-3 h-3 mr-1" />Online</>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getDeliveryStatusBadge(order.deliveryStatus)}</TableCell>
                          <TableCell>
                            <div className="text-right">
                              <div className="font-medium">₹{order.amount.toLocaleString()}</div>
                              {order.offers.length > 0 && (
                                <div className="text-xs text-green-600 flex items-center">
                                  <Gift className="w-3 h-3 mr-1" />
                                  ₹{order.offers.reduce((sum, offer) => sum + offer.discount, 0)} saved
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem>Update status</DropdownMenuItem>
                                <DropdownMenuItem>Contact customer</DropdownMenuItem>
                                <DropdownMenuItem>Print invoice</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Dialog open={selectedOrder !== null} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder?.orderId}</DialogTitle>
              <DialogDescription>
                Complete information about this order
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Name:</strong> {getCustomerName(selectedOrder)}</div>
                      <div><strong>Phone:</strong> {selectedOrder.address.mobileNumber}</div>
                      {selectedOrder.address.email && (
                        <div><strong>Email:</strong> {selectedOrder.address.email}</div>
                      )}
                      <div><strong>Address:</strong></div>
                      <div className="text-sm text-muted-foreground pl-4">
                        {selectedOrder.address.addressLine1}<br />
                        {selectedOrder.address.addressLine2 && <>{selectedOrder.address.addressLine2}<br /></>}
                        {selectedOrder.address.landmark && <>{selectedOrder.address.landmark}<br /></>}
                        {selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}<br />
                        {selectedOrder.address.country}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Order Status:</span>
                        {getOrderStatusBadge(selectedOrder.orderStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Payment Status:</span>
                        {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Delivery Status:</span>
                        {getDeliveryStatusBadge(selectedOrder.deliveryStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Payment Method:</span>
                        <span>{selectedOrder.cashOnDelivery ? 'Cash on Delivery' : 'Online Payment'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item._id} className="flex justify-between items-center p-2 border rounded">
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">Variant: {item.variant}</div>
                          </div>
                          <div className="text-right">
                            <div>Qty: {item.quantity}</div>
                            <div className="font-medium">₹{item.price.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 space-y-2 border-t pt-4">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₹{selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                      </div>
                      {selectedOrder.offers.map((offer) => (
                        <div key={offer._id} className="flex justify-between text-green-600">
                          <span>{offer.title} discount:</span>
                          <span>-₹{offer.discount}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>₹{selectedOrder.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {selectedOrder.utmParams && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Marketing Attribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div><strong>Source:</strong> {selectedOrder.utmParams.utm_source}</div>
                        <div><strong>Medium:</strong> {selectedOrder.utmParams.utm_medium}</div>
                        <div><strong>Campaign:</strong> {selectedOrder.utmParams.utm_campaign}</div>
                        {selectedOrder.utmParams.utm_term && (
                          <div><strong>Term:</strong> {selectedOrder.utmParams.utm_term}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex gap-2">
                  <Button className="flex-1">Update Status</Button>
                  <Button variant="outline" className="flex-1">Contact Customer</Button>
                  <Button variant="outline">Print Invoice</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}