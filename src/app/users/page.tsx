"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Phone, MessageCircle, Calendar, CalendarDays, Edit3, Save, X, ExternalLink, Mail } from "lucide-react"
import Link from "next/link"
import { useUsers, useInvalidateCache } from "@/hooks/use-data"
import type { User } from "@/types"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"


const getVerificationBadge = (verified: boolean) => {
  return verified ? (
    <Badge className="bg-success/20 text-success">
      <CheckCircle className="w-3 h-3 mr-1" />Verified
    </Badge>
  ) : (
    <Badge className="bg-destructive/20 text-destructive">
      <XCircle className="w-3 h-3 mr-1" />Unverified
    </Badge>
  )
}


// Phone verification filter options
const phoneVerificationOptions = [
  { value: 'verified', label: 'Verified', icon: CheckCircle },
  { value: 'unverified', label: 'Unverified', icon: XCircle }
]

// Last ordered date range filter options
const lastOrderedOptions = [
  { value: 'never', label: 'Never ordered', icon: XCircle },
  { value: 'last_7_days', label: 'Last 7 days', icon: CalendarDays },
  { value: 'last_30_days', label: 'Last 30 days', icon: CalendarDays },
  { value: 'last_90_days', label: 'Last 90 days', icon: CalendarDays },
  { value: 'over_90_days', label: 'Over 90 days ago', icon: Calendar }
]


function CustomersPageContent() {
  const searchParams = useSearchParams()
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
  const [noteCustomer, setNoteCustomer] = useState<User | null>(null)
  const [noteText, setNoteText] = useState<string>('')
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [phoneVerifiedFilter, setPhoneVerifiedFilter] = useState<string[]>([])
  const [lastOrderedFilter, setLastOrderedFilter] = useState<string[]>([])

  // Initialize search query from URL parameters
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search')
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery)
    }
  }, [searchParams])
  
  const { data: usersData, isLoading, mutate } = useUsers(
    currentPage, 
    pageSize,
    searchQuery,
    phoneVerifiedFilter,
    lastOrderedFilter
  )
  const { invalidateAll } = useInvalidateCache()
  
  const users = (usersData as any)?.users || []
  const pagination = (usersData as any)?.pagination || {}
  
  const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPageSize)
  }
  
  // Handle filter changes - reset to page 1 when filters change
  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setCurrentPage(1)
  }
  
  const handlePhoneVerifiedChange = (verified: string[]) => {
    setPhoneVerifiedFilter(verified)
    setCurrentPage(1)
  }

  const handleLastOrderedChange = (dateRange: string[]) => {
    setLastOrderedFilter(dateRange)
    setCurrentPage(1)
  }

  const handleOpenNoteDialog = (customer: User) => {
    setNoteCustomer(customer)
    setNoteText(customer.notes || '')
  }

  const handleSaveNote = async () => {
    if (!noteCustomer) return
    
    setIsSavingNote(true)
    try {
      const response = await fetch(`/api/users/${noteCustomer._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: noteText })
      })
      
      if (response.ok) {
        // Refresh the data by invalidating cache and re-fetching
        mutate()
        setNoteCustomer(null)
        setNoteText('')
      }
    } catch (error) {
      console.error('Failed to update note:', error)
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleCloseNoteDialog = () => {
    setNoteCustomer(null)
    setNoteText('')
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
          <Link href={`/users/${customer._id}`} className="flex items-center space-x-2 hover:bg-muted/50 -m-2 p-2 rounded group">
            <Avatar className="h-6 w-6">
              {customer.avatar && (
                <AvatarImage src={customer.avatar} alt={customer.name || 'Customer avatar'} />
              )}
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {customer.name ? customer.name.split(' ').map((n: string) => n[0]).join('') : 
                 customer.phoneNumber.slice(-2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-1">
                {customer.name || <span className="text-muted-foreground">-</span>}
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>
        )
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div>
            {customer.phoneNumber}
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const customer = row.original
        const hasValidEmail = customer.email && !customer.email.includes('@temp.local')
        return (
          <div>
            {hasValidEmail ? customer.email : (
              <span className="text-muted-foreground">-</span>
            )}
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
      accessorKey: "noOfOrders",
      header: "Orders",
      cell: ({ row }) => {
        const orderCount = row.getValue("noOfOrders") as number || 0
        return (
          <div>
            <div>{orderCount}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "lastOrderedOn",
      header: "Last Ordered",
      cell: ({ row }) => {
        const lastOrderedOn = row.getValue("lastOrderedOn")
        if (!lastOrderedOn) return <div className="text-sm text-muted-foreground">Never</div>
        
        const date = new Date(lastOrderedOn as string)
        return (
          <div className="text-sm">
            {date.toLocaleDateString()}
          </div>
        )
      },
    },
    {
      id: "totalSpent",
      header: "Total Spent",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">-</div>
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const customer = row.original
        const notes = row.getValue("notes") as string
        
        return (
          <div 
            className="flex items-center gap-2 max-w-48 cursor-pointer group hover:bg-muted/50 -m-2 p-2 rounded"
            onClick={() => handleOpenNoteDialog(customer)}
          >
            <div className="text-sm text-muted-foreground truncate flex-1">
              {notes || '-'}
            </div>
            <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
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
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="Search by name, phone, email, ID, or notes..."
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          filterableColumns={[
            {
              id: "phoneNumberVerified",
              title: "Phone Verification",
              options: phoneVerificationOptions,
              value: phoneVerifiedFilter,
              onChange: handlePhoneVerifiedChange
            },
            {
              id: "lastOrderedOn",
              title: "Last Ordered",
              options: lastOrderedOptions,
              value: lastOrderedFilter,
              onChange: handleLastOrderedChange
            }
          ]}
          manualPagination={true}
          manualFiltering={true}
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
                      <div><strong>Total Orders:</strong> {selectedCustomer.noOfOrders || 0}</div>
                      <div><strong>Last Ordered:</strong> {selectedCustomer.lastOrderedOn ? new Date(selectedCustomer.lastOrderedOn).toLocaleDateString() : 'Never'}</div>
                      
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
                        <div><strong>Total Orders:</strong> {selectedCustomer.noOfOrders || 0}</div>
                        {selectedCustomer.lastOrderedOn && (
                          <div><strong>Last Order:</strong> {new Date(selectedCustomer.lastOrderedOn).toLocaleDateString()}</div>
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
        
        {/* Note Dialog */}
        <Dialog open={noteCustomer !== null} onOpenChange={handleCloseNoteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{noteCustomer?.notes ? 'Edit Note' : 'Add Note'}</DialogTitle>
              <DialogDescription>
                {noteCustomer?.notes ? 'Update the note for' : 'Add a note for'} <strong>{noteCustomer?.name || 'this customer'}</strong>
              </DialogDescription>
            </DialogHeader>
            
            {noteCustomer && (
              <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{noteCustomer.phoneNumber}</span>
                    {getVerificationBadge(noteCustomer.phoneNumberVerified)}
                  </div>
                  {noteCustomer.name && (
                    <div className="text-sm font-medium">{noteCustomer.name}</div>
                  )}
                </div>
                
                {/* Note Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Note</label>
                  <Textarea
                    placeholder="Add your note here..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={4}
                  />
                </div>
                
                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCloseNoteDialog}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                  >
                    {isSavingNote ? 'Saving...' : (noteCustomer.notes ? 'Update Note' : 'Save Note')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomersPageContent />
    </Suspense>
  )
}