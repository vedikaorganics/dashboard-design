"use client"

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
import { MoreHorizontal, Search, Filter, Star, TrendingUp, TrendingDown } from "lucide-react"

const reviews = [
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

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-muted-foreground">({rating})</span>
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,847</div>
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
              <div className="text-2xl font-bold">4.3</div>
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
              <div className="text-2xl font-bold">23</div>
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
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search reviews..." className="pl-8" />
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Helpful</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {review.customer.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{review.customer}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{review.product}</TableCell>
                      <TableCell>{renderStars(review.rating)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <div className="font-medium text-sm">{review.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {review.comment}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{review.date}</TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell>{review.helpful}</TableCell>
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
                            <DropdownMenuItem>View full review</DropdownMenuItem>
                            <DropdownMenuItem>Respond to review</DropdownMenuItem>
                            <DropdownMenuItem>Approve review</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Flag as inappropriate
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