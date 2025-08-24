"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { MoreHorizontal, Search, Filter, Users, CheckCircle, XCircle, Phone, Mail, MapPin, ShoppingBag, Gift, MessageCircle } from "lucide-react"
import { useUsers } from "@/hooks/use-data"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import type { User } from "@/types"


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

const getCustomerTypeBadge = (customerType: string) => {
  switch (customerType) {
    case 'VIP': return <Badge className="bg-gold-100 text-gold-800">VIP</Badge>
    case 'Regular': return <Badge className="bg-blue-100 text-blue-800">Regular</Badge>
    case 'New': return <Badge variant="outline">New</Badge>
    default: return <Badge variant="secondary">Customer</Badge>
  }
}

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [verificationFilter, setVerificationFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)
  
  const { data: usersData, isLoading } = useUsers(currentPage, 50)
  
  const users = (usersData as any)?.users || []
  const pagination = (usersData as any)?.pagination || {}
  
  const filteredCustomers = users.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phoneNumber.includes(searchTerm) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesVerification = verificationFilter === "all" || 
                              (verificationFilter === "verified" && user.phoneNumberVerified) ||
                              (verificationFilter === "unverified" && !user.phoneNumberVerified)
    return matchesSearch && matchesVerification
  })
  
  const totalUsers = pagination.total || 0
  const verifiedCount = users.filter((u: any) => u.phoneNumberVerified).length
  const avgOrders = users.length > 0 ? users.reduce((sum: number, user: any) => sum + (user.orderCount || 0), 0) / users.length : 0
  const vipCount = users.filter((u: any) => u.customerType === 'VIP').length
  
  return (
    <DashboardLayout title="Customers Management">
      <div className="flex-1 space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Customers</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedCount}</div>
              <p className="text-xs text-muted-foreground">{totalUsers > 0 ? Math.round((verifiedCount / totalUsers) * 100) : 0}% verified</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgOrders.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">per customer</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vipCount}</div>
              <p className="text-xs text-muted-foreground">10+ orders</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              View and manage customer accounts, order history, and rewards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name, phone, or email..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone Verification</TableHead>
                      <TableHead>Customer Type</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Offers Used</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer: any) => {
                      return (
                        <TableRow key={customer._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-orange-100 text-orange-800">
                                  {customer.name ? customer.name.split(' ').map((n: string) => n[0]).join('') : 
                                   customer.phoneNumber.slice(-2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {customer.name || 'Unnamed Customer'}
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
                          </TableCell>
                          <TableCell>{getVerificationBadge(customer.phoneNumberVerified)}</TableCell>
                          <TableCell>{getCustomerTypeBadge(customer.customerType)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{customer.orderCount || 0}</div>
                            <div className="text-xs text-muted-foreground">
                              Total orders placed
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">₹{(customer.totalSpent || 0).toLocaleString()}</div>
                            {customer.totalSpent > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Avg: ₹{Math.round((customer.totalSpent || 0) / Math.max((customer.orderCount || 1), 1)).toLocaleString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              ₹{(customer.unclaimedRewards || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Unclaimed rewards
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-32 truncate text-sm text-muted-foreground">
                              {customer.notes || 'No notes'}
                            </div>
                            {customer.notes && (
                              <MessageCircle className="w-3 h-3 inline ml-1 text-blue-500" />
                            )}
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
                                <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem>View orders</DropdownMenuItem>
                                <DropdownMenuItem>Edit notes</DropdownMenuItem>
                                <DropdownMenuItem>Send offer</DropdownMenuItem>
                                <DropdownMenuItem>Contact customer</DropdownMenuItem>
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
            {pagination.totalPages > 1 && (
              <div className="flex justify-center pt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNumber = i + 1
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(pageNumber)
                            }}
                            isActive={currentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    {pagination.totalPages > 5 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < pagination.totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
        
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
                      <div><strong>Customer Type:</strong> {getCustomerTypeBadge((selectedCustomer as any).customerType)}</div>
                      
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