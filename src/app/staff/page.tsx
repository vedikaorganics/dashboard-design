"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { MoreHorizontal, Search, Filter, Users, Shield, Clock, TrendingUp, Plus } from "lucide-react"
import { useStaff } from "@/hooks/use-data"

const mockStaff = [
  {
    id: "STF-001",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "Admin",
    department: "Management",
    status: "active",
    joinDate: "2022-03-15",
    lastLogin: "2024-06-15 10:30",
    permissions: ["full_access", "user_management", "system_settings"],
    avatar: "/avatars/01.png",
  },
  {
    id: "STF-002",
    name: "Mike Chen",
    email: "mike@example.com",
    role: "Manager",
    department: "Sales",
    status: "active",
    joinDate: "2022-07-20",
    lastLogin: "2024-06-15 09:45",
    permissions: ["orders", "customers", "reports"],
    avatar: "/avatars/02.png",
  },
  {
    id: "STF-003",
    name: "Emily Davis",
    email: "emily@example.com",
    role: "Support Agent",
    department: "Customer Service",
    status: "active",
    joinDate: "2023-01-10",
    lastLogin: "2024-06-14 16:20",
    permissions: ["orders", "customers", "reviews"],
    avatar: "/avatars/03.png",
  },
  {
    id: "STF-004",
    name: "David Wilson",
    email: "david@example.com",
    role: "Analyst",
    department: "Analytics",
    status: "inactive",
    joinDate: "2023-05-12",
    lastLogin: "2024-06-10 14:15",
    permissions: ["reports", "analytics"],
    avatar: "/avatars/04.png",
  },
  {
    id: "STF-005",
    name: "Lisa Rodriguez",
    email: "lisa@example.com",
    role: "Inventory Manager",
    department: "Operations",
    status: "active",
    joinDate: "2022-11-08",
    lastLogin: "2024-06-15 08:00",
    permissions: ["products", "inventory", "orders"],
    avatar: "/avatars/05.png",
  },
]

const getStatusBadge = (status: string) => {
  return (
    <Badge variant={status === "active" ? "default" : "secondary"}>
      {status}
    </Badge>
  )
}

const getRoleBadge = (role: string) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    Admin: "default",
    Manager: "secondary",
    "Support Agent": "outline",
    Analyst: "outline",
    "Inventory Manager": "secondary",
  }
  
  return <Badge variant={variants[role] || "outline"}>{role}</Badge>
}

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  
  const { data: staffData, isLoading } = useStaff()
  
  const staff = (staffData as any)?.staff || []
  const totalStaff = (staffData as any)?.totalStaff || 0
  const activeStaff = (staffData as any)?.activeStaff || 0
  const adminCount = (staffData as any)?.adminCount || 0
  
  const filteredStaff = staff.filter((member: any) =>
    (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <DashboardLayout title="Staff Management">
      <div className="flex-1 space-y-4 p-8 pt-6">
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStaff}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+3</span>
                <span>from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStaff}</div>
              <p className="text-xs text-muted-foreground">91.5% of total staff</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCount}</div>
              <p className="text-xs text-muted-foreground">with full system access</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Now</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">active in last 30 minutes</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Staff Directory</CardTitle>
            <CardDescription>
              Manage staff members, roles, and permissions for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 py-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search staff members..." className="pl-8" />
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
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member: any) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} alt={member.name || 'Staff'} />
                            <AvatarFallback>
                              {(member.name || 'UN').split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(member.role || 'staff')}</TableCell>
                      <TableCell>{member.department || 'Unknown'}</TableCell>
                      <TableCell>{getStatusBadge(member.isActive ? 'active' : 'inactive')}</TableCell>
                      <TableCell>{member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-40">
                          {(member.permissions || []).slice(0, 2).map((permission: string) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission.replace('_', ' ')}
                            </Badge>
                          ))}
                          {(member.permissions || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(member.permissions || []).length - 2}
                            </Badge>
                          )}
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
                            <DropdownMenuItem>View profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit details</DropdownMenuItem>
                            <DropdownMenuItem>Manage permissions</DropdownMenuItem>
                            <DropdownMenuItem>Reset password</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Deactivate user
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
      <Button 
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        onClick={() => console.log('Add Staff Member')}
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </DashboardLayout>
  )
}