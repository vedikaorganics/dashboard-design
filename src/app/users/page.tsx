"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { MoreHorizontal, CheckCircle, XCircle, Phone, Mail, MessageCircle, Eye } from "lucide-react"
import { useUsers } from "@/hooks/use-data"
import type { User } from "@/types"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"


const getVerificationBadge = (verified: boolean) => {
  return verified ? (
    <Badge className="bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3 mr-1" />Verified
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800">
      <XCircle className="w-3 h-3 mr-1" />Unverified
    </Badge>
  )
}


export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  
  const { data: usersData } = useUsers(currentPage, pageSize)
  
  const users = (usersData as any)?.users || []
  const pagination = (usersData as any)?.pagination || {}
  
  const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPageSize)
  }

  const columns: ColumnDef<any>[] = [
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
      accessorKey: "name",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-orange-100 text-orange-800">
                {customer.name ? customer.name.split(' ').map((n: string) => n[0]).join('') : 
                 customer.phoneNumber.slice(-2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>
                {customer.name || '-'}
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                {customer.phoneNumber}
              </div>
              {customer.email && !customer.email.includes('@temp.local') && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <Mail className="w-3 h-3 mr-1" />
                  {customer.email}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phoneNumberVerified",
      header: "Phone Verification",
      cell: ({ row }) => getVerificationBadge(row.getValue("phoneNumberVerified")),
    },
    {
      accessorKey: "orderCount",
      header: "Orders",
      cell: ({ row }) => {
        const orderCount = row.getValue("orderCount") as number || 0
        return (
          <div>
            <div>{orderCount}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => {
        const totalSpent = row.getValue("totalSpent") as number || 0
        const orderCount = row.original.orderCount || 1
        return (
          <div>
            <div>₹{totalSpent.toLocaleString()}</div>
            {totalSpent > 0 && (
              <div className="text-xs text-muted-foreground">
                Avg: ₹{Math.round(totalSpent / Math.max(orderCount, 1)).toLocaleString()}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string
        return (
          <div className="max-w-32 truncate text-sm text-muted-foreground">
            {notes || '-'}
            {notes && <MessageCircle className="w-3 h-3 inline ml-1 text-blue-500" />}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original
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
              <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem>Add note</DropdownMenuItem>
              <DropdownMenuItem>Update info</DropdownMenuItem>
              <DropdownMenuItem>Send offer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
  return (
    <DashboardLayout title="Customers">
      <div className="flex-1 space-y-6">
        
        <DataTable 
          columns={columns} 
          data={users}
          searchKey="name"
          searchPlaceholder="Search by name, phone, or email..."
          manualPagination={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={(currentPage - 1) || 0}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
        />
        
        <Dialog open={selectedCustomer !== null} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Profile - {selectedCustomer?.name || 'Unnamed Customer'}</DialogTitle>
              <DialogDescription>
                Complete customer information and order history
              </DialogDescription>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedCustomer.phoneNumber}</span>
                        {getVerificationBadge(selectedCustomer.phoneNumberVerified)}
                      </div>
                      
                      {selectedCustomer.email && !selectedCustomer.email.includes('@temp.local') && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      
                      <div><strong>Customer ID:</strong> {selectedCustomer.userId}</div>
                      <div><strong>Joined:</strong> {new Date(selectedCustomer.createdAt).toLocaleDateString()}</div>
                      <div><strong>Last Updated:</strong> {new Date(selectedCustomer.updatedAt).toLocaleDateString()}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div><strong>Total Orders:</strong> {(selectedCustomer as any).orderCount || 0}</div>
                      <div><strong>Total Spent:</strong> ₹{((selectedCustomer as any).totalSpent || 0).toLocaleString()}</div>
                      
                      {selectedCustomer.notes && (
                        <div>
                          <strong>Notes:</strong>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">
                            {selectedCustomer.notes}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Offers & Rewards</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <strong>Available Offers:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedCustomer.offers.map((offer, index) => (
                            <Badge key={index} variant="secondary">{offer}</Badge>
                          ))}
                          {selectedCustomer.offers.length === 0 && (
                            <span className="text-muted-foreground">No active offers</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <strong>Rewards History:</strong>
                        <div className="mt-2">
                          <div className="text-sm">Total earned: ₹{((selectedCustomer as any).unclaimedRewards || 0).toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Detailed reward history available in full view</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div><strong>Total Orders:</strong> {(selectedCustomer as any).orderCount || 0}</div>
                        <div><strong>Total Spent:</strong> ₹{((selectedCustomer as any).totalSpent || 0).toLocaleString()}</div>
                        {(selectedCustomer as any).lastOrder && (
                          <div><strong>Last Order:</strong> {new Date((selectedCustomer as any).lastOrder).toLocaleDateString()}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        View full order history in Orders page
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                  <Button className="flex-1">Edit Customer</Button>
                  <Button variant="outline" className="flex-1">Send Offer</Button>
                  <Button variant="outline">Contact</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}