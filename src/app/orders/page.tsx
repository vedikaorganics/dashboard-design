"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, Clock, Truck, Package } from "lucide-react"
import { useOrders } from "@/hooks/use-data"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Order } from "@/types"



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
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  
  const { data: ordersData } = useOrders(currentPage, pageSize)
  
  const orders = (ordersData as any)?.orders || []
  const pagination = (ordersData as any)?.pagination || {}
  const summary = (ordersData as any)?.summary || {}
  
  const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPageSize)
  }

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
          <div className="font-medium">{getCustomerName(order)}</div>
        )
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
          <div className="font-medium">₹{amount.toLocaleString()}</div>
        )
      },
    },
  ]
  
  return (
    <DashboardLayout title="Orders">
      <div className="flex-1 space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.paymentPending || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shipping Pending</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.shippingPending || 0}</div>
              <p className="text-xs text-muted-foreground">Ready to ship</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.inTransit || 0}</div>
              <p className="text-xs text-muted-foreground">On the way</p>
            </CardContent>
          </Card>
        </div>
        
        <DataTable 
          columns={columns} 
          data={orders}
          searchKey="orderId"
          searchPlaceholder="Search by order ID, customer name, or phone..."
          manualPagination={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={(currentPage - 1) || 0} // Convert 1-based to 0-based
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </DashboardLayout>
  )
}