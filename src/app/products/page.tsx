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
import { MoreHorizontal, Search, Filter, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { FloatingActionButton } from "@/components/ui/floating-action-button"

const products = [
  {
    id: "PROD-001",
    name: "Wireless Bluetooth Headphones",
    sku: "WBH-2024-001",
    category: "Electronics",
    price: "$129.99",
    stock: 45,
    status: "active",
    image: "/api/placeholder/50/50",
    sales: 234,
    rating: 4.5,
    lastUpdated: "2024-06-15",
  },
  {
    id: "PROD-002",
    name: "Smartphone Protection Case",
    sku: "SPC-2024-002",
    category: "Accessories",
    price: "$24.99",
    stock: 156,
    status: "active",
    image: "/api/placeholder/50/50",
    sales: 456,
    rating: 4.2,
    lastUpdated: "2024-06-14",
  },
  {
    id: "PROD-003",
    name: "Gaming Mechanical Keyboard",
    sku: "GMK-2024-003",
    category: "Electronics",
    price: "$89.99",
    stock: 23,
    status: "low_stock",
    image: "/api/placeholder/50/50",
    sales: 123,
    rating: 4.7,
    lastUpdated: "2024-06-13",
  },
  {
    id: "PROD-004",
    name: "Adjustable Laptop Stand",
    sku: "ALS-2024-004",
    category: "Office",
    price: "$45.99",
    stock: 0,
    status: "out_of_stock",
    image: "/api/placeholder/50/50",
    sales: 89,
    rating: 4.8,
    lastUpdated: "2024-06-12",
  },
  {
    id: "PROD-005",
    name: "USB-C Charging Cable",
    sku: "UCC-2024-005",
    category: "Accessories",
    price: "$12.99",
    stock: 340,
    status: "active",
    image: "/api/placeholder/50/50",
    sales: 789,
    rating: 4.1,
    lastUpdated: "2024-06-11",
  },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    low_stock: "secondary",
    out_of_stock: "destructive",
    discontinued: "outline",
  }
  
  const labels: Record<string, string> = {
    active: "Active",
    low_stock: "Low Stock",
    out_of_stock: "Out of Stock",
    discontinued: "Discontinued",
  }
  
  return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>
}

const getStockStatus = (stock: number) => {
  if (stock === 0) return { color: "text-red-500", icon: AlertTriangle }
  if (stock < 25) return { color: "text-yellow-500", icon: AlertTriangle }
  return { color: "text-green-500", icon: Package }
}

export default function ProductsPage() {
  return (
    <DashboardLayout title="Products">
      <div className="flex-1 space-y-4 p-8 pt-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">573</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+12</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">542</div>
              <p className="text-xs text-muted-foreground">94.6% of total inventory</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">23</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">-5</span>
                <span>from last week</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">requires immediate attention</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              Manage your product catalog, inventory levels, and pricing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search products..." className="pl-8" />
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
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock)
                    const StockIcon = stockStatus.icon
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {product.id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{product.price}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <StockIcon className={`h-4 w-4 ${stockStatus.color}`} />
                            <span className={stockStatus.color}>{product.stock}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status)}</TableCell>
                        <TableCell>{product.sales}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <span>{product.rating}</span>
                            <span className="text-yellow-400">★</span>
                          </div>
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
                              <DropdownMenuItem>View details</DropdownMenuItem>
                              <DropdownMenuItem>Edit product</DropdownMenuItem>
                              <DropdownMenuItem>Update stock</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Delete product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <FloatingActionButton onClick={() => console.log('Add Product')} />
    </DashboardLayout>
  )
}