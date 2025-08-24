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
import { MoreHorizontal, Search, Filter, Users, Shield, Clock, TrendingUp, Plus, Eye, UserCog, Trash2, Key } from "lucide-react"
import { useStaff } from "@/hooks/use-data"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

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
    accessorKey: "name",
    header: "Staff Member",
    cell: ({ row }) => {
      const staff = row.original
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={staff.avatar} alt={staff.name} />
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {staff.name.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{staff.name}</div>
            <div className="text-sm text-muted-foreground">{staff.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => getRoleBadge(row.getValue("role")),
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("status")),
  },
  {
    accessorKey: "joinDate",
    header: "Join Date",
    cell: ({ row }) => {
      const joinDate = row.getValue("joinDate") as string
      return new Date(joinDate).toLocaleDateString()
    },
  },
  {
    accessorKey: "lastLogin",
    header: "Last Login",
    cell: ({ row }) => {
      const lastLogin = row.getValue("lastLogin") as string
      return (
        <div className="text-sm">
          {new Date(lastLogin).toLocaleDateString()}
        </div>
      )
    },
  },
  {
    accessorKey: "permissions",
    header: "Permissions",
    cell: ({ row }) => {
      const permissions = row.getValue("permissions") as string[]
      return (
        <div className="flex flex-wrap gap-1">
          {permissions.slice(0, 2).map((permission, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {permission.replace('_', ' ')}
            </Badge>
          ))}
          {permissions.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{permissions.length - 2} more
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const staff = row.original
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
              <UserCog className="mr-2 h-4 w-4" />
              Edit profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="mr-2 h-4 w-4" />
              Manage permissions
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

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
            <DataTable 
              columns={columns} 
              data={filteredStaff.length > 0 ? filteredStaff : mockStaff}
              searchKey="name"
              searchPlaceholder="Search staff members..."
            />
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