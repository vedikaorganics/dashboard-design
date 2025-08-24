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
import { MoreHorizontal, Search, Filter, TrendingUp, TrendingDown, Eye, Users, Phone, MessageSquare, Globe, Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { PieChart, BarChart } from "@/components/charts"
import { useCampaigns } from "@/hooks/use-data"



const getChannelIcon = (source: string, medium?: string) => {
  if (medium.toLowerCase().includes('call') || source.toLowerCase().includes('call')) {
    return <Phone className="w-4 h-4" />
  }
  if (source.toLowerCase().includes('whatsapp') || medium.toLowerCase().includes('whatsapp')) {
    return <MessageSquare className="w-4 h-4" />
  }
  if (source.toLowerCase().includes('google') || source.toLowerCase().includes('facebook') || source.toLowerCase().includes('instagram')) {
    return <Globe className="w-4 h-4" />
  }
  return <Target className="w-4 h-4" />
}

const getChannelBadge = (source: string, medium: string) => {
  const channelKey = `${source}-${medium}`.toLowerCase()
  
  if (channelKey.includes('call')) {
    return <Badge className="bg-blue-100 text-blue-800">Phone</Badge>
  }
  if (channelKey.includes('whatsapp')) {
    return <Badge className="bg-green-100 text-green-800">WhatsApp</Badge>
  }
  if (channelKey.includes('google')) {
    return <Badge className="bg-red-100 text-red-800">Google</Badge>
  }
  if (channelKey.includes('facebook')) {
    return <Badge className="bg-blue-100 text-blue-800">Facebook</Badge>
  }
  if (channelKey.includes('instagram')) {
    return <Badge className="bg-pink-100 text-pink-800">Instagram</Badge>
  }
  return <Badge variant="outline">Other</Badge>
}

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  
  const { data: campaignsData, isLoading } = useCampaigns()
  
  const campaigns = (campaignsData as any)?.campaigns || []
  const summary = (campaignsData as any)?.summary || {}
  const chartData = (campaignsData as any)?.chartData || {}
  
  const totalRevenue = summary.totalRevenue || 0
  const totalOrders = summary.totalOrders || 0
  const totalCustomers = summary.totalCustomers || 0
  const avgOrderValue = summary.avgOrderValue || 0
  const totalCampaigns = summary.totalCampaigns || 0
  
  const filteredCampaigns = campaigns.filter((campaign: any) =>
    campaign.campaign.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Chart data from API
  const revenueChartData = chartData.revenueChart || []
  const ordersChartData = chartData.ordersChart || []
  
  return (
    <DashboardLayout title="Marketing Campaigns">
      <div className="flex-1 space-y-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaign Sources</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">Active marketing channels</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From tracked campaigns</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">Orders with UTM tracking</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.round(avgOrderValue).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all campaigns</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          <PieChart
            title="Revenue by Campaign Source"
            description="Revenue breakdown by marketing channel"
            data={revenueChartData}
            height={350}
          />
          
          <BarChart
            title="Orders by Campaign"
            description="Order volume per marketing source"
            data={ordersChartData}
            height={350}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance Analysis</CardTitle>
            <CardDescription>
              UTM tracking and attribution analysis for your marketing efforts. Data based on actual orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search campaigns..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign Source</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Customers</TableHead>
                      <TableHead>Avg Order Value</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map((campaign, index) => {
                      const [source, medium] = campaign.campaign.split(' - ')
                      const revenueShare = (campaign.revenue / totalRevenue) * 100
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getChannelIcon(source, medium)}
                              <div>
                                <div className="font-medium">{source}</div>
                                <div className="text-sm text-muted-foreground">{medium}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getChannelBadge(source, medium)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{campaign.orders}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round((campaign.orders / totalOrders) * 100)}% of total
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">₹{campaign.revenue.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {revenueShare.toFixed(1)}% of total
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{campaign.customers}</div>
                            <div className="text-xs text-muted-foreground">
                              {(campaign.customers / campaign.orders * 100).toFixed(0)}% unique
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">₹{Math.round(campaign.avgOrderValue).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {campaign.avgOrderValue > avgOrderValue ? '+' : ''}{Math.round(((campaign.avgOrderValue - avgOrderValue) / avgOrderValue) * 100)}% vs avg
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={revenueShare} className="w-full h-2" />
                              <div className="text-xs text-muted-foreground">
                                Revenue share: {revenueShare.toFixed(1)}%
                              </div>
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
                                <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem>View orders</DropdownMenuItem>
                                <DropdownMenuItem>Customer analysis</DropdownMenuItem>
                                <DropdownMenuItem>Export data</DropdownMenuItem>
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
          </CardContent>
        </Card>
        
        <Dialog open={selectedCampaign !== null} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Campaign Details</DialogTitle>
              <DialogDescription>
                Performance analysis for {selectedCampaign?.campaign}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCampaign && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div><strong>Source:</strong> {selectedCampaign.campaign.split(' - ')[0]}</div>
                      <div><strong>Medium:</strong> {selectedCampaign.campaign.split(' - ')[1]}</div>
                      <div><strong>Total Orders:</strong> {selectedCampaign.orders}</div>
                      <div><strong>Unique Customers:</strong> {selectedCampaign.customers}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Financial Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div><strong>Total Revenue:</strong> ₹{selectedCampaign.revenue.toLocaleString()}</div>
                      <div><strong>Average Order Value:</strong> ₹{Math.round(selectedCampaign.avgOrderValue).toLocaleString()}</div>
                      <div><strong>Revenue Share:</strong> {((selectedCampaign.revenue / totalRevenue) * 100).toFixed(1)}%</div>
                      <div><strong>Customer Lifetime Value:</strong> ₹{Math.round(selectedCampaign.revenue / selectedCampaign.customers).toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <span>Orders per Customer:</span>
                        <span className="font-medium">{(selectedCampaign.orders / selectedCampaign.customers).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Customer Acquisition Rate:</span>
                        <span className="font-medium">{((selectedCampaign.customers / selectedCampaign.orders) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Revenue per Customer:</span>
                        <span className="font-medium">₹{Math.round(selectedCampaign.revenue / selectedCampaign.customers).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}