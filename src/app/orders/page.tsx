"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, CheckCircle, Clock, Truck, Package, Phone, MapPin, CreditCard, Gift } from "lucide-react"
import { useOrders } from "@/hooks/use-data"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Order } from "@/types"


const getOrderStatusBadge = (orderStatus: string) => {
  switch (orderStatus) {
    case 'CONFIRMED':
      return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>
    case 'PENDING':
      return <Badge className="bg-warning/20 text-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'DELIVERED':
      return <Badge className="bg-info/20 text-info"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
    case 'CANCELLED':
      return <Badge className="bg-destructive/20 text-destructive">Cancelled</Badge>
    default:
      return <Badge variant="outline">{orderStatus}</Badge>
  }
}

const getDeliveryStatusBadge = (deliveryStatus: string) => {
  switch (deliveryStatus) {
    case 'PENDING':
      return <Badge variant="outline"><Package className="w-3 h-3 mr-1" />Pending</Badge>
    case 'SHIPPED':
      return <Badge className="bg-info/20 text-info"><Truck className="w-3 h-3 mr-1" />Shipped</Badge>
    case 'DELIVERED':
      return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>
    default:
      return <Badge variant="outline">{deliveryStatus}</Badge>
  }
}

const getPaymentStatusBadge = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'PAID':
      return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>
    case 'CASH_ON_DELIVERY':
      return <Badge className="bg-success/20 text-success"><CheckCircle className="w-3 h-3 mr-1" />COD</Badge>
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'FAILED':
      return <Badge className="bg-destructive/20 text-destructive">Failed</Badge>
    default:
      return <Badge variant="outline">{paymentStatus}</Badge>
  }
}

const getCustomerName = (order: Order) => {
  return order.address.firstName + (order.address.lastName ? ` ${order.address.lastName}` : '')
}

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  const { data: ordersData, isLoading } = useOrders(currentPage, 50, statusFilter === "all" ? undefined : statusFilter)
  
  const orders = (ordersData as any)?.orders || []
  const pagination = (ordersData as any)?.pagination || {}

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order ID" />
      ),
      cell: ({ row }) => <div className="font-medium">#{row.getValue("orderId")}</div>,
    },
    {
      id: "customer",
      accessorFn: (row) => getCustomerName(row),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => {
        const order = row.original
        return (
          <div>
            <div className="font-medium">{getCustomerName(order)}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {order.address.mobileNumber}
            </div>
            <div className="text-sm text-muted-foreground flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {order.address.city}, {order.address.state}
            </div>
          </div>
        )
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div>
            <div className="text-sm font-medium">
              {order.items[0]?.title.split('(')[0].trim()}
            </div>
            {order.items.length > 1 && (
              <div className="text-sm text-muted-foreground">
                +{order.items.length - 1} more
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Qty: {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "orderStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => getOrderStatusBadge(row.getValue("orderStatus")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "paymentStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment" />
      ),
      cell: ({ row }) => getPaymentStatusBadge(row.getValue("paymentStatus")),
    },
    {
      accessorKey: "deliveryStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delivery" />
      ),
      cell: ({ row }) => getDeliveryStatusBadge(row.getValue("deliveryStatus")),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const order = row.original
        const amount = (row.getValue("totalAmount") as number) || order.amount || 0
        return (
          <div>
            <div className="font-medium">₹{amount.toLocaleString()}</div>
            {order.offers?.length > 0 && (
              <div className="text-xs text-green-600">
                ₹{order.offers.reduce((sum: number, offer: any) => sum + (offer.discount || 0), 0)} saved
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original
        return (
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
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
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
            <DataTable 
              columns={columns} 
              data={orders}
              searchKey="orderId"
              searchPlaceholder="Search by order ID, customer name, or phone..."
            />
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