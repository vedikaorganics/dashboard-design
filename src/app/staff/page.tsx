"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Eye, UserCog } from "lucide-react"
import { useStaff } from "@/hooks/use-data"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"


const getRoleBadge = (role: string) => {
  const isAdmin = role?.toLowerCase() === 'admin'
  return <Badge variant={isAdmin ? "default" : "outline"}>{role || '-'}</Badge>
}


export default function StaffPage() {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  
  const { data: staffData, isLoading } = useStaff(currentPage, pageSize)
  
  const staff = (staffData as any)?.staff || []
  const pagination = (staffData as any)?.pagination || {}
  
  const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPageSize)
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
      accessorKey: "fullName",
      header: "Staff Member",
      cell: ({ row }) => {
        const staff = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary">
                {(staff.fullName || staff.name || '').split(' ').map((n: string) => n[0] || '').join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div>{staff.fullName || staff.name || '-'}</div>
              <div className="text-sm text-muted-foreground">{staff.email || '-'}</div>
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
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive")
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        const lastLogin = row.getValue("lastLogin") as string
        return lastLogin ? (
          <div className="text-sm">
            {new Date(lastLogin).toLocaleDateString()}
          </div>
        ) : '-'
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
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
  return (
    <DashboardLayout title="Staff Management" requiredRole="admin">
      <div className="flex-1 space-y-4 p-8 pt-6">
        
        <DataTable 
          columns={columns} 
          data={staff}
          searchKey="fullName"
          searchPlaceholder="Search staff members..."
          manualPagination={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={(currentPage - 1) || 0}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
        />
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