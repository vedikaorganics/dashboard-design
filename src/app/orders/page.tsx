"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle, Clock, Truck, Package, Ban, ChevronRight } from "lucide-react"
import { useOrders } from "@/hooks/use-data"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Order } from "@/types"
import { cn } from "@/lib/utils"

interface AlertMetricProps {
  title: string
  count: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'warning' | 'action' | 'info'
  onClick?: () => void
}

const AlertMetric = ({ title, count, description, icon: Icon, variant, onClick }: AlertMetricProps) => {
  const isActive = count > 0
  
  const variantClasses = {
    warning: {
      container: isActive 
        ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:border-yellow-800 dark:hover:bg-yellow-900/50" 
        : "bg-muted/30 border-border",
      icon: isActive ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground",
      count: isActive ? "text-yellow-900 dark:text-yellow-100" : "text-muted-foreground",
      pulse: isActive ? "animate-pulse" : ""
    },
    action: {
      container: isActive 
        ? "bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/50 dark:border-orange-800 dark:hover:bg-orange-900/50" 
        : "bg-muted/30 border-border",
      icon: isActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground",
      count: isActive ? "text-orange-900 dark:text-orange-100" : "text-muted-foreground",
      pulse: isActive ? "animate-pulse" : ""
    },
    info: {
      container: isActive 
        ? "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/50 dark:border-blue-800 dark:hover:bg-blue-900/50" 
        : "bg-muted/30 border-border",
      icon: isActive ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground",
      count: isActive ? "text-blue-900 dark:text-blue-100" : "text-muted-foreground",
      pulse: isActive ? "animate-pulse" : ""
    }
  }

  const classes = variantClasses[variant]

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer group",
        classes.container,
        onClick && "hover:shadow-sm"
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={cn("p-2 rounded-full", classes.pulse)}>
          <Icon className={cn("h-5 w-5", classes.icon)} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-sm">{title}</h3>
            <span className={cn("text-lg font-bold", classes.count)}>
              {count}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      
      {onClick && isActive && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      )}
    </div>
  )
}

const deliveryStatusOptions = [
  { value: 'PENDING', label: 'Pending', icon: Package, className: 'border-gray-200 text-gray-700' },
  { value: 'PREPARING', label: 'Preparing', icon: Package, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'DISPATCHED', label: 'Dispatched', icon: Truck, className: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'CANCELLED', label: 'Cancelled', icon: Package, className: 'bg-red-100 text-red-800 border-red-200' }
]

const DeliveryStatusDropdown = ({ order, onStatusUpdate }: { 
  order: Order, 
  onStatusUpdate: (orderId: string, newStatus: string) => void 
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Only show delivery status for confirmed orders (COD or PAID)
  if (order.paymentStatus !== 'CASH_ON_DELIVERY' && order.paymentStatus !== 'PAID') {
    return <span className="text-muted-foreground">-</span>
  }

  const currentStatus = deliveryStatusOptions.find(option => option.value === order.deliveryStatus)
  const CurrentIcon = currentStatus?.icon || Package

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order.deliveryStatus) return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deliveryStatus: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update delivery status')
      }

      onStatusUpdate(order.orderId, newStatus)
      toast.success('Delivery status updated successfully')
    } catch (error) {
      toast.error('Failed to update delivery status')
      console.error('Status update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
            currentStatus?.className || 'border-gray-200 text-gray-700'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isUpdating}
        >
          <CurrentIcon className="w-3 h-3 mr-1" />
          {currentStatus?.label || order.deliveryStatus}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {deliveryStatusOptions.map((option) => {
          const OptionIcon = option.icon
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <OptionIcon className="w-3 h-3" />
              {option.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
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

// Payment status filter options
const paymentStatusOptions = [
  { value: 'PAID', label: 'Paid', icon: CheckCircle },
  { value: 'CASH_ON_DELIVERY', label: 'COD', icon: CheckCircle },
  { value: 'PENDING', label: 'Pending', icon: Clock },
  { value: 'FAILED', label: 'Failed', icon: Ban }
]

// Delivery status filter options (reusing existing options)
const deliveryStatusFilterOptions = deliveryStatusOptions.map(option => ({
  value: option.value,
  label: option.label,
  icon: option.icon
}))


export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string[]>([])
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string[]>([])
  
  const { data: ordersData, mutate } = useOrders(
    currentPage, 
    pageSize, 
    undefined, // status
    searchQuery,
    paymentStatusFilter,
    deliveryStatusFilter
  )
  const [localOrders, setLocalOrders] = useState<any[]>([])
  
  // Use local orders with optimistic updates, fallback to API data
  const orders = localOrders.length > 0 ? localOrders : (ordersData as any)?.orders || []
  const pagination = (ordersData as any)?.pagination || {}
  const summary = (ordersData as any)?.summary || {}
  
  // Update local state when API data changes
  useEffect(() => {
    if (ordersData && (ordersData as any)?.orders) {
      setLocalOrders((ordersData as any).orders)
    }
  }, [ordersData])
  
  // Handle delivery status updates with optimistic updates
  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    // Optimistic update to local state
    setLocalOrders(prev => 
      prev.map(order => 
        order.orderId === orderId 
          ? { ...order, deliveryStatus: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
    )
    
    // Quick refresh from server for consistency
    setTimeout(() => mutate(), 100)
  }
  
  const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPageSize)
  }
  
  // Handle filter changes - reset to page 1 when filters change
  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setCurrentPage(1)
  }
  
  const handlePaymentStatusChange = (status: string[]) => {
    setPaymentStatusFilter(status)
    setCurrentPage(1)
  }
  
  const handleDeliveryStatusChange = (status: string[]) => {
    setDeliveryStatusFilter(status)
    setCurrentPage(1)
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
      cell: ({ row }) => (
        <Link 
          href={`/orders/${row.getValue("orderId")}`}
          className="hover:underline"
        >
          #{row.getValue("orderId")}
        </Link>
      ),
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
          <div>{getCustomerName(order)}</div>
        )
      },
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
          <div>₹{amount.toLocaleString()}</div>
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
      id: "notes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Notes" />
      ),
      size: 160, // Bigger fixed column width
      cell: ({ row }) => {
        const order = row.original
        const user = (order as any).user
        const notes = user?.notes
        
        if (!notes) {
          return (
            <div className="text-sm text-muted-foreground w-24">-</div>
          )
        }
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help w-24">
                  <span className="text-sm block truncate text-blue-600 dark:text-blue-400">
                    {notes}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-80">
                <div>
                  <strong>Customer Notes:</strong><br />
                  {notes}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: "deliveryStatus",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delivery" />
      ),
      cell: ({ row }) => (
        <DeliveryStatusDropdown 
          order={row.original} 
          onStatusUpdate={handleStatusUpdate}
        />
      ),
    },
    {
      id: "utmParams",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="UTM" />
      ),
      cell: ({ row }) => {
        const order = row.original
        const utmParams = order.utmParams
        
        if (!utmParams || !utmParams.utm_source) {
          return (
            <div className="text-sm text-muted-foreground">-</div>
          )
        }
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <span className="text-sm">{utmParams.utm_source}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-80">
                <div className="space-y-1">
                  <div><strong>Source:</strong> {utmParams.utm_source}</div>
                  {utmParams.utm_medium && (
                    <div><strong>Medium:</strong> {utmParams.utm_medium}</div>
                  )}
                  {utmParams.utm_campaign && (
                    <div><strong>Campaign:</strong> {utmParams.utm_campaign}</div>
                  )}
                  {utmParams.utm_term && (
                    <div><strong>Term:</strong> {utmParams.utm_term}</div>
                  )}
                  {utmParams.utm_content && (
                    <div><strong>Content:</strong> {utmParams.utm_content}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
  ]
  
  return (
    <DashboardLayout title="Orders">
      <div className="flex-1 space-y-6">
        
        <div className="space-y-3">
          <AlertMetric
            title="Payment Pending"
            count={summary.paymentPending || 0}
            description="Orders awaiting payment"
            icon={Clock}
            variant="warning"
            onClick={() => handlePaymentStatusChange(['PENDING'])}
          />
          
          <AlertMetric
            title="Shipping Pending"
            count={summary.shippingPending || 0}
            description="Orders ready to ship"
            icon={Package}
            variant="action"
            onClick={() => handleDeliveryStatusChange(['PENDING'])}
          />
          
          <AlertMetric
            title="In Transit"
            count={summary.inTransit || 0}
            description="Orders on the way"
            icon={Truck}
            variant="info"
            onClick={() => handleDeliveryStatusChange(['DISPATCHED'])}
          />
        </div>
        
        <DataTable 
          columns={columns} 
          data={orders}
          searchKey="orderId"
          searchPlaceholder="Search by order ID, customer name, amount, or UTM..."
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          filterableColumns={[
            {
              id: "paymentStatus",
              title: "Payment Status",
              options: paymentStatusOptions,
              value: paymentStatusFilter,
              onChange: handlePaymentStatusChange
            },
            {
              id: "deliveryStatus",
              title: "Delivery Status",
              options: deliveryStatusFilterOptions,
              value: deliveryStatusFilter,
              onChange: handleDeliveryStatusChange
            }
          ]}
          manualPagination={true}
          manualFiltering={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={(currentPage - 1) || 0} // Convert 1-based to 0-based
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </DashboardLayout>
  )
}