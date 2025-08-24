"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { MoreHorizontal, Search, Filter, Plus, Gift, Percent, TrendingUp, Calendar, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

const offers = [
  {
    id: "OFF-001",
    name: "Summer Sale 2024",
    code: "SUMMER20",
    type: "percentage",
    discount: "20%",
    status: "active",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    usageLimit: 1000,
    usageCount: 342,
    minOrder: "$50",
    applicableProducts: "All Products",
    revenue: "$15,420",
  },
  {
    id: "OFF-002",
    name: "First Time Buyer",
    code: "WELCOME15",
    type: "percentage",
    discount: "15%",
    status: "active",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    usageLimit: 5000,
    usageCount: 1250,
    minOrder: "$25",
    applicableProducts: "Selected Categories",
    revenue: "$8,750",
  },
  {
    id: "OFF-003",
    name: "Flash Sale",
    code: "FLASH50",
    type: "fixed",
    discount: "$50",
    status: "expired",
    startDate: "2024-05-15",
    endDate: "2024-05-17",
    usageLimit: 100,
    usageCount: 100,
    minOrder: "$200",
    applicableProducts: "Electronics",
    revenue: "$12,500",
  },
  {
    id: "OFF-004",
    name: "Student Discount",
    code: "STUDENT10",
    type: "percentage",
    discount: "10%",
    status: "scheduled",
    startDate: "2024-09-01",
    endDate: "2024-12-15",
    usageLimit: 2000,
    usageCount: 0,
    minOrder: "$30",
    applicableProducts: "Books & Supplies",
    revenue: "$0",
  },
  {
    id: "OFF-005",
    name: "Free Shipping",
    code: "FREESHIP",
    type: "shipping",
    discount: "Free Shipping",
    status: "active",
    startDate: "2024-06-01",
    endDate: "2024-12-31",
    usageLimit: 10000,
    usageCount: 2100,
    minOrder: "$75",
    applicableProducts: "All Products",
    revenue: "$5,250",
  },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    scheduled: "secondary",
    expired: "outline",
    paused: "destructive",
  }
  
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

const getTypeBadge = (type: string) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    percentage: "default",
    fixed: "secondary",
    shipping: "outline",
  }
  
  const labels: Record<string, string> = {
    percentage: "Percentage",
    fixed: "Fixed Amount",
    shipping: "Free Shipping",
  }
  
  return <Badge variant={variants[type] || "outline"}>{labels[type] || type}</Badge>
}

const getUsageProgress = (used: number, limit: number) => {
  return (used / limit) * 100
}

export default function OffersPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Offers & Discounts</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+3</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,692</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+24.5%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue from Offers</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$41,920</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+18.2%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">offers expire this week</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Offer Management</CardTitle>
            <CardDescription>
              Create and manage discount codes, promotional offers, and special deals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search offers..." className="pl-8" />
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer Details</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{offer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {offer.startDate} - {offer.endDate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {offer.code}
                        </code>
                      </TableCell>
                      <TableCell>{getTypeBadge(offer.type)}</TableCell>
                      <TableCell className="font-medium">{offer.discount}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{offer.usageCount}</span>
                            <span>{offer.usageLimit}</span>
                          </div>
                          <Progress 
                            value={getUsageProgress(offer.usageCount, offer.usageLimit)} 
                            className="w-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(offer.status)}</TableCell>
                      <TableCell className="font-medium">{offer.revenue}</TableCell>
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
                            <DropdownMenuItem>View analytics</DropdownMenuItem>
                            <DropdownMenuItem>Edit offer</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>Pause offer</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete offer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}