"use client"

import { useState, Suspense } from "react"
import { useUrlPagination } from "@/hooks/use-url-state"
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
  const roleMap: Record<string, { variant: string; className: string }> = {
    'admin': { variant: 'outline', className: 'bg-destructive/20 text-destructive border-destructive/50' },
    'manager': { variant: 'outline', className: 'bg-warning/20 text-warning border-warning/50' },
    'staff': { variant: 'outline', className: 'bg-info/20 text-info border-info/50' },
    'support': { variant: 'outline', className: 'bg-success/20 text-success border-success/50' }
  }
  
  const config = roleMap[role?.toLowerCase()] || { variant: 'outline', className: '' }
  return <Badge variant={config.variant as any} className={config.className}>{role || '-'}</Badge>
}


function StaffPageContent() {
  const { page, pageSize, pageIndex, setPagination } = useUrlPagination(10)
  
  const { data: staffData, isLoading } = useStaff(page, pageSize)
  
  const staff = (staffData as any)?.staff || []
  const pagination = (staffData as any)?.pagination || {}
  
  const handlePaginationChange = setPagination

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
              <div className="text-xs text-muted-foreground">{staff.email || '-'}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => getRoleBadge(row.getValue("role")),
      sortingFn: (rowA, rowB) => {
        const roleOrder: Record<string, number> = { 'admin': 0, 'manager': 1, 'staff': 2, 'support': 3 }
        const roleA = (rowA.getValue("role") as string)?.toLowerCase() || 'zzz'
        const roleB = (rowB.getValue("role") as string)?.toLowerCase() || 'zzz'
        return (roleOrder[roleA] ?? 999) - (roleOrder[roleB] ?? 999)
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive")
        return (
          <Badge 
            variant="outline" 
            className={isActive ? "bg-success/20 text-success border-success/50" : "bg-muted/50 text-muted-foreground border-muted"}
          >
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
          isLoading={isLoading}
          searchKey="fullName"
          searchPlaceholder="Search staff members..."
          manualPagination={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={pageIndex}
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

export default function StaffPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StaffPageContent />
    </Suspense>
  )
}