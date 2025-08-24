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
import { MoreHorizontal, Search, Filter, Gift, Percent, TrendingUp, Calendar, Users, Eye, Tag, Clock, CheckCircle, Edit, Trash2, Copy } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useOffers } from "@/hooks/use-data"
import type { Offer } from "@/types"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"


const getOfferUsage = (offerId: string) => {
  // Mock usage data - replace with real API call
  return Math.floor(Math.random() * 100)
}

const getOfferStatus = (offer: Offer) => {
  const now = new Date()
  const startDate = new Date(offer.createdAt)
  const endDate = new Date(offer.updatedAt)
  
  return 'active' // Simplified for now
}

const getOfferStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
    case 'expired':
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Expired</Badge>
    case 'scheduled':
      return <Badge className="bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getOfferType = (isUserOffer: boolean, triggerPrice: number | null) => {
  if (isUserOffer) return 'User-specific'
  if (triggerPrice) return 'Conditional'
  return 'General'
}

export default function OffersPage() {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  
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
      accessorKey: "title",
      header: "Offer",
      cell: ({ row }) => {
        const offer = row.original
        return (
          <div>
            <div className="font-medium">{offer.title}</div>
            <div className="text-sm text-muted-foreground">#{offer.id}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const offer = row.original
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-orange-50">
              <Percent className="w-3 h-3 mr-1" />
              ₹{offer.discount}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) => {
        const offer = row.original
        const type = getOfferType(offer.isUserOffer, offer.triggerPrice)
        return (
          <Badge variant={type === 'User-specific' ? 'default' : type === 'Conditional' ? 'secondary' : 'outline'}>
            {type}
          </Badge>
        )
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const offer = row.original
        const status = getOfferStatus(offer)
        return getOfferStatusBadge(status)
      },
    },
    {
      accessorKey: "triggerPrice",
      header: "Min Order",
      cell: ({ row }) => {
        const triggerPrice = row.getValue("triggerPrice") as number | null
        return triggerPrice ? `₹${triggerPrice.toLocaleString()}` : 'No minimum'
      },
    },
    {
      id: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const offer = row.original
        const usage = getOfferUsage(offer.id)
        return (
          <div className="w-24">
            <div className="flex justify-between text-sm mb-1">
              <span>{usage}%</span>
            </div>
            <Progress value={usage} className="h-2" />
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string
        return new Date(createdAt).toLocaleDateString()
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const offer = row.original
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
              <DropdownMenuItem onClick={() => setSelectedOffer(offer)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit offer
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
  const { data: offersData, isLoading } = useOffers()
  
  const offers = (offersData as any)?.offers || []
  const totalOffers = (offersData as any)?.totalOffers || 0
  const totalUsage = (offersData as any)?.totalUsage || 0
  const totalSavings = (offersData as any)?.totalSavings || 0
  
  const filteredOffers = offers.filter((offer: any) => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || 
                       (typeFilter === "user" && offer.isUserOffer) ||
                       (typeFilter === "general" && !offer.isUserOffer)
    return matchesSearch && matchesType
  })
  
  const userOffers = offers.filter((o: any) => o.isUserOffer).length
  const conditionalOffers = offers.filter((o: any) => o.triggerPrice !== null).length
  
  return (
    <DashboardLayout title="Offers & Promotions">
      <div className="flex-1 space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOffers}</div>
              <p className="text-xs text-muted-foreground">Active discount codes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsage}</div>
              <p className="text-xs text-muted-foreground">Offers applied to orders</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalSavings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Customer savings via offers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Offers</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userOffers}</div>
              <p className="text-xs text-muted-foreground">Personalized offers</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Offers & Discount Codes</CardTitle>
            <CardDescription>
              Manage promotional offers, welcome discounts, and conditional deals for your oil store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={filteredOffers}
              searchKey="title"
              searchPlaceholder="Search offers by title or code..."
            />
          </CardContent>
        </Card>
        
        <Dialog open={selectedOffer !== null} onOpenChange={() => setSelectedOffer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Offer Details - {selectedOffer?.title}</DialogTitle>
              <DialogDescription>
                Complete information about this promotional offer
              </DialogDescription>
            </DialogHeader>
            
            {selectedOffer && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Offer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div><strong>Code:</strong> <code className="bg-muted px-2 py-1 rounded">{selectedOffer.id}</code></div>
                      <div><strong>Title:</strong> {selectedOffer.title}</div>
                      <div><strong>Description:</strong> {selectedOffer.description}</div>
                      <div><strong>Discount:</strong> ₹{selectedOffer.discount.toLocaleString()}</div>
                      <div><strong>Type:</strong> {getOfferType(selectedOffer.isUserOffer, selectedOffer.triggerPrice)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Usage & Conditions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div><strong>Times Used:</strong> {getOfferUsage(selectedOffer.id)}</div>
                      <div><strong>User-specific:</strong> {selectedOffer.isUserOffer ? 'Yes' : 'No'}</div>
                      {selectedOffer.triggerPrice && (
                        <div><strong>Minimum Order:</strong> ₹{selectedOffer.triggerPrice.toLocaleString()}</div>
                      )}
                      <div><strong>Status:</strong> {getOfferStatusBadge(getOfferStatus(selectedOffer))}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Created:</strong> {new Date(selectedOffer.createdAt).toLocaleString()}</div>
                    <div><strong>Last Updated:</strong> {new Date(selectedOffer.updatedAt).toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {([] as any[])
                        .filter(order => order.offers?.some((offer: any) => offer.offerId === selectedOffer.id))
                        .slice(0, 3)
                        .map((order: any) => {
                          const offerUsed = order.offers.find((offer: any) => offer.offerId === selectedOffer.id)
                          return (
                            <div key={order._id} className="flex justify-between items-center p-2 border rounded">
                              <div>
                                <div className="font-medium">Order #{order.orderId}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.address.firstName} | {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-600">₹{offerUsed?.discount} saved</div>
                                <div className="text-sm text-muted-foreground">on ₹{order.amount.toLocaleString()}</div>
                              </div>
                            </div>
                          )
                        })
                      }
                      {getOfferUsage(selectedOffer.id) === 0 && (
                        <p className="text-muted-foreground">This offer hasn't been used yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                  <Button className="flex-1">Edit Offer</Button>
                  <Button variant="outline" className="flex-1">View Analytics</Button>
                  <Button variant="outline">Duplicate</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}