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
import { MoreHorizontal, Search, Filter, TrendingUp, TrendingDown, Eye, Users } from "lucide-react"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Progress } from "@/components/ui/progress"

const campaigns = [
  {
    id: "CAM-001",
    name: "Summer Sale 2024",
    type: "email",
    status: "active",
    startDate: "2024-06-01",
    endDate: "2024-08-31",
    budget: "$5,000",
    spent: "$3,250",
    impressions: 125000,
    clicks: 8750,
    conversions: 325,
    ctr: "7.0%",
    conversionRate: "3.7%",
  },
  {
    id: "CAM-002",
    name: "Back to School Promo",
    type: "social",
    status: "scheduled",
    startDate: "2024-08-15",
    endDate: "2024-09-15",
    budget: "$3,500",
    spent: "$0",
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: "0%",
    conversionRate: "0%",
  },
  {
    id: "CAM-003",
    name: "Holiday Collection Launch",
    type: "display",
    status: "completed",
    startDate: "2023-12-01",
    endDate: "2023-12-31",
    budget: "$8,000",
    spent: "$7,890",
    impressions: 450000,
    clicks: 22500,
    conversions: 1125,
    ctr: "5.0%",
    conversionRate: "5.0%",
  },
  {
    id: "CAM-004",
    name: "Flash Sale Alert",
    type: "sms",
    status: "paused",
    startDate: "2024-06-10",
    endDate: "2024-06-12",
    budget: "$1,200",
    spent: "$800",
    impressions: 25000,
    clicks: 3750,
    conversions: 187,
    ctr: "15.0%",
    conversionRate: "5.0%",
  },
  {
    id: "CAM-005",
    name: "New Customer Onboarding",
    type: "email",
    status: "active",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    budget: "$2,400",
    spent: "$1,200",
    impressions: 75000,
    clicks: 15000,
    conversions: 900,
    ctr: "20.0%",
    conversionRate: "6.0%",
  },
]

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    scheduled: "secondary",
    completed: "outline",
    paused: "destructive",
  }
  
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>
}

const getTypeBadge = (type: string) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    email: "default",
    social: "secondary",
    display: "outline",
    sms: "default",
  }
  
  return <Badge variant={variants[type] || "outline"}>{type}</Badge>
}

const getBudgetProgress = (spent: string, budget: string) => {
  const spentNum = parseFloat(spent.replace('$', '').replace(',', ''))
  const budgetNum = parseFloat(budget.replace('$', '').replace(',', ''))
  return (spentNum / budgetNum) * 100
}

export default function CampaignsPage() {
  return (
    <DashboardLayout title="Campaigns">
      <div className="flex-1 space-y-4 p-8 pt-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+2</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">675K</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+15.3%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2,537</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+8.1%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8%</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">-0.2%</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Campaign Management</CardTitle>
            <CardDescription>
              Create, monitor, and manage your marketing campaigns across all channels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search campaigns..." className="pl-8" />
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
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Budget/Spent</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {campaign.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(campaign.type)}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{campaign.spent}</span>
                            <span>{campaign.budget}</span>
                          </div>
                          <Progress 
                            value={getBudgetProgress(campaign.spent, campaign.budget)} 
                            className="w-full"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>CTR: {campaign.ctr}</div>
                          <div>Conv: {campaign.conversionRate}</div>
                          <div className="text-muted-foreground">
                            {campaign.conversions} conversions
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>{campaign.startDate}</div>
                          <div>{campaign.endDate}</div>
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
                            <DropdownMenuItem>View analytics</DropdownMenuItem>
                            <DropdownMenuItem>Edit campaign</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>Pause campaign</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Delete campaign
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
      <FloatingActionButton onClick={() => console.log('Create Campaign')} />
    </DashboardLayout>
  )
}