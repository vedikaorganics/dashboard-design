"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useUrlState, useUrlPagination, useUrlSearchState, useUrlStateMultiple } from "@/hooks/use-url-state"
import { toast } from "sonner"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CheckCircle, Clock, Truck, Package, Ban, ChevronRight, RefreshCw, Edit3, Check, X, AlertTriangle } from "lucide-react"
import { useOrders } from "@/hooks/use-data"
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import type { Order } from "@/types"
import { cn, formatRelativeDateTime } from "@/lib/utils"

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
  
  const getVariantClasses = () => {
    if (!isActive) {
      return {
        container: "bg-muted/30 border-border",
        icon: "text-muted-foreground",
        count: "text-muted-foreground",
        pulse: ""
      }
    }

    switch (variant) {
      case 'action':
        return {
          container: "bg-warning/10 border-warning/30 hover:bg-warning/20",
          icon: "text-warning",
          count: "text-warning",
          pulse: "animate-pulse"
        }
      case 'info':
        return {
          container: "bg-info/10 border-info/30 hover:bg-info/20",
          icon: "text-info",
          count: "text-info",
          pulse: ""
        }
      case 'warning':
        return {
          container: "bg-destructive/10 border-destructive/30 hover:bg-destructive/20",
          icon: "text-destructive",
          count: "text-destructive",
          pulse: "animate-pulse"
        }
      default:
        return {
          container: "bg-muted/30 border-border hover:bg-muted/50",
          icon: "text-muted-foreground",
          count: "text-muted-foreground",
          pulse: ""
        }
    }
  }

  const classes = getVariantClasses()

  return (
    <div
      className={cn(
        "inline-flex items-center px-3 py-2 rounded border transition-all duration-200 cursor-pointer group",
        classes.container,
        onClick && "hover:shadow-sm"
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        <div className={cn("p-1 rounded-full", classes.pulse)}>
          <Icon className={cn("h-4 w-4", classes.icon)} />
        </div>
        <div className="flex items-center space-x-1.5">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className={cn("text-sm font-bold", classes.count)}>
            {count}
          </span>
        </div>
      </div>
      
      {onClick && isActive && (
        <div className="flex items-center ml-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-3 w-3" />
        </div>
      )}
    </div>
  )
}

const deliveryStatusOptions = [
  { value: 'PENDING', label: 'Pending', icon: Package, className: 'border-border text-muted-foreground bg-muted/10' },
  { value: 'PREPARING', label: 'Preparing', icon: Package, className: 'bg-warning/20 text-warning border-warning/30' },
  { value: 'DISPATCHED', label: 'Dispatched', icon: Truck, className: 'bg-info/20 text-info border-info/30' },
  { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle, className: 'bg-success/20 text-success border-success/30' },
  { value: 'CANCELLED', label: 'Cancelled', icon: Package, className: 'bg-destructive/20 text-destructive border-destructive/30' }
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
            currentStatus?.className || 'border-border text-muted-foreground bg-muted/10'
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

const PaymentStatusWithSync = ({ order, onSync }: { 
  order: Order, 
  onSync: (orderId: string) => void 
}) => {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/orders/sync-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.orderId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync payment')
      }

      toast.success('Payment status synced successfully', {
        description: `${order.orderId}: ${result.previousStatus} → ${result.newStatus}`
      })

      onSync(order.orderId)
    } catch (error) {
      console.error('Payment sync error:', error)
      toast.error('Failed to sync payment status', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSyncing(false)
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

  return (
    <div className="flex items-center gap-2">
      {getPaymentStatusBadge(order.paymentStatus)}
      {order.paymentStatus === 'PENDING' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync payment status with payment server</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

const EditableUserNotes = ({ order, onNotesUpdate }: { 
  order: Order, 
  onNotesUpdate: (orderId: string, userId: string, notes: string) => void 
}) => {
  const user = (order as any).user
  const originalNotes = user?.notes || ""
  const [editingNotes, setEditingNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Reset editing notes when opening the popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setEditingNotes(originalNotes)
    }
  }

  const handleSave = async () => {
    if (!user?._id) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: editingNotes }),
      })

      if (!response.ok) {
        throw new Error('Failed to update notes')
      }

      onNotesUpdate(order.orderId, user._id, editingNotes)
      toast.success('Customer notes updated successfully')
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to update customer notes')
      console.error('Notes update error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingNotes(originalNotes)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer w-full max-w-[320px] group">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <div className="text-xs leading-tight pr-6 break-words whitespace-normal">
                    {originalNotes ? (
                      originalNotes
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-0.5 right-0" />
                </div>
              </TooltipTrigger>
              {originalNotes && (
                <TooltipContent side="top" className="max-w-80">
                  <p className="whitespace-pre-wrap text-sm">{originalNotes}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm">Customer Notes</h4>
            <p className="text-xs text-muted-foreground">{originalNotes ? 'Edit notes about this customer' : 'Add notes about this customer'}</p>
          </div>
          <Textarea 
            value={editingNotes}
            onChange={(e) => setEditingNotes(e.target.value)}
            placeholder="Enter customer notes..."
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
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


function OrdersPageContent() {
  // URL state management
  const [searchQuery, setSearchQuery] = useUrlSearchState("search", 300)
  const [paymentStatusFilter, setPaymentStatusFilter] = useUrlState<string[]>("paymentStatus", [])
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useUrlState<string[]>("deliveryStatus", [])
  const { page, pageSize, pageIndex, setPagination } = useUrlPagination(10)
  const { clearAll, setMultiple } = useUrlStateMultiple()
  
  const { data: ordersData, isLoading, mutate } = useOrders(
    page, 
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

  // Handle payment sync
  const handlePaymentSync = (orderId: string) => {
    // Refresh data from server after sync
    mutate()
  }

  // Handle notes updates with optimistic updates
  const handleNotesUpdate = (orderId: string, userId: string, newNotes: string) => {
    // Optimistic update to local state
    setLocalOrders(prev => 
      prev.map(order => 
        order.orderId === orderId 
          ? { 
              ...order, 
              user: { 
                ...(order as any).user, 
                notes: newNotes,
                updatedAt: new Date().toISOString()
              }
            }
          : order
      )
    )
    
    // Quick refresh from server for consistency
    setTimeout(() => mutate(), 100)
  }
  
  const handlePaginationChange = setPagination
  
  // Handle filter changes
  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
  }
  
  const handlePaymentStatusChange = (status: string[]) => {
    setPaymentStatusFilter(status)
  }
  
  const handleDeliveryStatusChange = (status: string[]) => {
    setDeliveryStatusFilter(status)
  }

  const handleClearAll = () => {
    // Clear all filter parameters but keep pagination
    clearAll(['page', 'limit'])
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
        const customerName = getCustomerName(order)
        
        // Link to customer profile if we have userId
        if (order.userId) {
          return (
            <Link 
              href={`/users/${order.userId}`}
              className="hover:underline hover:text-primary"
            >
              {customerName}
            </Link>
          )
        }
        
        // Fallback to plain text if no userId
        return <div>{customerName}</div>
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order Time" />
      ),
      cell: ({ row }) => {
        const order = row.original
        const timestamp = order.time || order.createdAt
        const { time, relativeDate } = formatRelativeDateTime(timestamp)
        return (
          <div className="text-xs">
            <div className="font-mono">{time}</div>
            <div className="text-muted-foreground">{relativeDate}</div>
          </div>
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
      cell: ({ row }) => (
        <PaymentStatusWithSync 
          order={row.original} 
          onSync={handlePaymentSync}
        />
      ),
    },
    {
      id: "notes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Notes" />
      ),
      size: 350, // Increased width for better notes readability
      minSize: 250,
      cell: ({ row }) => {
        const order = row.original
        return (
          <EditableUserNotes 
            order={order} 
            onNotesUpdate={handleNotesUpdate}
          />
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
        
        <div className="flex gap-3 flex-wrap">
          <AlertMetric
            title="Shipping Pending"
            count={summary.shippingPending || 0}
            description="Orders ready to ship"
            icon={Package}
            variant="action"
            onClick={() => setMultiple({
              paymentStatus: ['PAID', 'CASH_ON_DELIVERY'],
              deliveryStatus: ['PENDING']
            })}
          />
          
          <AlertMetric
            title="In Transit"
            count={summary.inTransit || 0}
            description="Orders on the way"
            icon={Truck}
            variant="info"
            onClick={() => handleDeliveryStatusChange(['DISPATCHED'])}
          />
          
          <AlertMetric
            title="In Transit > 7 days"
            count={summary.inTransitOld || 0}
            description="Delayed shipments"
            icon={AlertTriangle}
            variant="warning"
            onClick={() => handleDeliveryStatusChange(['DISPATCHED'])}
          />
        </div>
        
        <DataTable 
          columns={columns} 
          data={orders}
          isLoading={isLoading}
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
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
          onClearAll={handleClearAll}
        />
      </div>
    </DashboardLayout>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersPageContent />
    </Suspense>
  )
}