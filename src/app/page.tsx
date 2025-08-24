import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, ShoppingCart, Package, DollarSign } from "lucide-react"
import { AreaChart, LineChart, BarChart, PieChart } from "@/components/charts"

const revenueData = [
  { name: 'Jan', value: 32000 },
  { name: 'Feb', value: 35000 },
  { name: 'Mar', value: 38000 },
  { name: 'Apr', value: 42000 },
  { name: 'May', value: 39000 },
  { name: 'Jun', value: 45000 },
]

const salesData = [
  { name: 'Electronics', value: 45 },
  { name: 'Clothing', value: 30 },
  { name: 'Books', value: 15 },
  { name: 'Home & Garden', value: 10 },
]

const ordersData = [
  { name: 'Mon', value: 120 },
  { name: 'Tue', value: 140 },
  { name: 'Wed', value: 160 },
  { name: 'Thu', value: 135 },
  { name: 'Fri', value: 180 },
  { name: 'Sat', value: 210 },
  { name: 'Sun', value: 95 },
]

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="flex-1 space-y-4">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+20.1%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+15.2%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8,429</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">-2.1%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">573</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+5.4%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your store</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Order #1234</p>
                    <p className="text-sm text-muted-foreground">John Doe - john@example.com</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Pending</Badge>
                    <div className="font-medium">$125.99</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Order #1235</p>
                    <p className="text-sm text-muted-foreground">Jane Smith - jane@example.com</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">Completed</Badge>
                    <div className="font-medium">$89.99</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Order #1236</p>
                    <p className="text-sm text-muted-foreground">Bob Johnson - bob@example.com</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Processing</Badge>
                    <div className="font-medium">$256.50</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-3 text-center hover:bg-accent cursor-pointer">
                  <ShoppingCart className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">New Order</p>
                </div>
                <div className="rounded-lg border p-3 text-center hover:bg-accent cursor-pointer">
                  <Package className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Add Product</p>
                </div>
                <div className="rounded-lg border p-3 text-center hover:bg-accent cursor-pointer">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">View Users</p>
                </div>
                <div className="rounded-lg border p-3 text-center hover:bg-accent cursor-pointer">
                  <DollarSign className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <AreaChart
            title="Revenue Trend"
            description="Monthly revenue over the past 6 months"
            data={revenueData}
            height={350}
          />
          
          <BarChart
            title="Daily Orders"
            description="Orders per day this week"
            data={ordersData}
            height={350}
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <PieChart
            title="Sales by Category"
            description="Breakdown of sales by product category"
            data={salesData}
            height={350}
          />
          
          <LineChart
            title="Revenue Growth"
            description="Revenue trend line over time"
            data={revenueData}
            height={350}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}