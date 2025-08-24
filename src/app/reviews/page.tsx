"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { MoreHorizontal, Search, Filter, Star, TrendingUp, TrendingDown, Eye, Check, X, Flag } from "lucide-react"
import { useReviews } from "@/hooks/use-data"
import { StarRating } from "@/components/ui/star-rating"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

const mockReviews = [
  {
    id: "REV-001",
    customer: "John Doe",
    product: "Wireless Headphones",
    rating: 5,
    title: "Excellent quality!",
    comment: "These headphones are amazing. Great sound quality and comfortable to wear.",
    date: "2023-06-15",
    status: "published",
    helpful: 12,
  },
  {
    id: "REV-002",
    customer: "Jane Smith",
    product: "Smartphone Case",
    rating: 4,
    title: "Good protection",
    comment: "The case fits well and protects my phone. Could be slightly more durable.",
    date: "2023-06-14",
    status: "published",
    helpful: 8,
  },
  {
    id: "REV-003",
    customer: "Bob Johnson",
    product: "Gaming Mouse",
    rating: 2,
    title: "Not as expected",
    comment: "The mouse feels cheap and the buttons are not responsive enough for gaming.",
    date: "2023-06-13",
    status: "pending",
    helpful: 3,
  },
  {
    id: "REV-004",
    customer: "Alice Brown",
    product: "Laptop Stand",
    rating: 5,
    title: "Perfect for my setup",
    comment: "Sturdy build and perfect height adjustment. Highly recommend!",
    date: "2023-06-12",
    status: "published",
    helpful: 15,
  },
  {
    id: "REV-005",
    customer: "Charlie Wilson",
    product: "USB-C Cable",
    rating: 3,
    title: "Average quality",
    comment: "Works fine but nothing special. Expected better build quality for the price.",
    date: "2023-06-11",
    status: "flagged",
    helpful: 2,
  },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    published: "default",
    pending: "secondary",
    flagged: "destructive",
    rejected: "outline",
  }
  
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
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
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const review = row.original
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {review.customer.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{review.customer}</div>
            <div className="text-xs text-muted-foreground">{review.date}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
      const review = row.original
      return (
        <div>
          <div className="font-medium text-sm">{review.product}</div>
          <div className="text-xs text-muted-foreground">#{review.id}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number
      return (
        <div className="flex items-center space-x-2">
          <StarRating rating={rating} />
          <span className="text-sm font-medium">{rating}/5</span>
        </div>
      )
    },
  },
  {
    accessorKey: "title",
    header: "Review",
    cell: ({ row }) => {
      const review = row.original
      return (
        <div className="max-w-md">
          <div className="font-medium text-sm mb-1">{review.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {review.comment}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("status")),
  },
  {
    accessorKey: "helpful",
    header: "Helpful",
    cell: ({ row }) => {
      const helpful = row.getValue("helpful") as number
      return (
        <div className="text-center">
          <div className="font-medium text-sm">{helpful}</div>
          <div className="text-xs text-muted-foreground">votes</div>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const review = row.original
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
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Check className="mr-2 h-4 w-4" />
              Approve review
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Flag className="mr-2 h-4 w-4" />
              Flag review
            </DropdownMenuItem>
            <DropdownMenuItem>
              <X className="mr-2 h-4 w-4" />
              Reject review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [approvedFilter, setApprovedFilter] = useState<boolean | undefined>(undefined)
  
  const { data: reviewsData, isLoading } = useReviews(currentPage, 50, approvedFilter)
  
  const reviews = (reviewsData as any)?.reviews || []
  const pagination = (reviewsData as any)?.pagination || {}
  
  // Calculate statistics from API data
  const totalReviews = pagination.total || 0
  const approvedReviews = reviews.filter((r: any) => r.isApproved).length
  const pendingReviews = reviews.filter((r: any) => !r.isApproved).length
  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length 
    : 0
  
  return (
    <DashboardLayout title="Reviews">
      <div className="flex-1 space-y-4 p-8 pt-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+8.2%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+0.2</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReviews}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">-12%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87%</div>
              <p className="text-xs text-muted-foreground">reviews with responses</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Review Management</CardTitle>
            <CardDescription>
              Monitor and manage customer reviews for your products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={reviews.length > 0 ? reviews : mockReviews}
              searchKey="customer"
              searchPlaceholder="Search reviews..."
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}