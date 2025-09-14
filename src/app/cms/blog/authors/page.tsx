"use client"

import { useState, Suspense } from "react"
import { useUrlPagination } from "@/hooks/use-url-state"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Eye, UserCog, Star, ArrowLeft } from "lucide-react"
import { useAuthors } from "@/hooks/use-data"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import type { Author } from "@/types/authors"
import { AuthorCreateDialog } from "@/components/cms/authors/AuthorCreateDialog"
import { AuthorEditDialog } from "@/components/cms/authors/AuthorEditDialog"
import Link from "next/link"

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { variant: string; className: string }> = {
    'active': { variant: 'outline', className: 'bg-success/20 text-success border-success/50' },
    'inactive': { variant: 'outline', className: 'bg-warning/20 text-warning border-warning/50' },
    'archived': { variant: 'outline', className: 'bg-muted/50 text-muted-foreground border-muted' }
  }
  
  const config = statusMap[status?.toLowerCase()] || { variant: 'outline', className: '' }
  return <Badge variant={config.variant as any} className={config.className}>{status || '-'}</Badge>
}

function AuthorsPageContent() {
  const { page, pageSize, pageIndex, setPagination } = useUrlPagination(10)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAuthorSlug, setEditingAuthorSlug] = useState<string | undefined>()
  
  const { data: authorsData, isLoading, mutate } = useAuthors(page, pageSize)
  
  const authors = (authorsData as any)?.authors || []
  const pagination = (authorsData as any)?.pagination || {}
  
  const handlePaginationChange = setPagination

  const handleAuthorCreated = (newAuthor: Author) => {
    // Refresh the authors list
    mutate()
  }

  const handleAuthorUpdated = (updatedAuthor: Author) => {
    // Refresh the authors list
    mutate()
  }

  const handleEditAuthor = (authorSlug: string) => {
    setEditingAuthorSlug(authorSlug)
    setIsEditDialogOpen(true)
  }


  const columns: ColumnDef<Author>[] = [
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
      accessorKey: "displayName",
      header: "Author",
      cell: ({ row }) => {
        const author = row.original
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              {author.avatar && (
                <AvatarImage src={author.avatar} alt={author.displayName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary">
                {author.displayName.split(' ').map((n: string) => n[0] || '').join('') || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{author.displayName}</span>
                {author.featured && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">{author.email || author.slug}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return role ? (
          <Badge variant="secondary" className="text-xs">
            {role}
          </Badge>
        ) : '-'
      },
    },
    {
      accessorKey: "stats.postCount",
      header: "Posts",
      cell: ({ row }) => {
        const postCount = row.original.stats?.postCount || 0
        return (
          <div className="text-sm font-medium">
            {postCount}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      sortingFn: (rowA, rowB) => {
        const statusOrder: Record<string, number> = { 'active': 0, 'inactive': 1, 'archived': 2 }
        const statusA = (rowA.getValue("status") as string)?.toLowerCase() || 'zzz'
        const statusB = (rowB.getValue("status") as string)?.toLowerCase() || 'zzz'
        return (statusOrder[statusA] ?? 999) - (statusOrder[statusB] ?? 999)
      },
    },
    {
      accessorKey: "stats.lastPublished",
      header: "Last Published",
      cell: ({ row }) => {
        const lastPublished = row.original.stats?.lastPublished
        return lastPublished ? (
          <div className="text-sm">
            {new Date(lastPublished).toLocaleDateString()}
          </div>
        ) : '-'
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const author = row.original
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
              <DropdownMenuItem asChild>
                <Link href={`/cms/blog/authors/${author.slug}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditAuthor(author.slug)}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Edit author
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/cms/blog/authors/${author.slug}/posts`}>
                  View posts
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
  return (
    <DashboardLayout title="Blog Authors" requiredRole="admin">
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cms/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>


        {/* Authors Table */}
        <DataTable 
          columns={columns} 
          data={authors}
          isLoading={isLoading}
          searchKey="displayName"
          searchPlaceholder="Search authors..."
          manualPagination={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
        />
      </div>
      
      {/* Floating Add Button */}
      <Button 
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        onClick={() => setIsCreateDialogOpen(true)}
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Author Dialog */}
      <AuthorCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onAuthorCreated={handleAuthorCreated}
      />

      {/* Edit Author Dialog */}
      <AuthorEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        authorSlug={editingAuthorSlug}
        onAuthorUpdated={handleAuthorUpdated}
      />
    </DashboardLayout>
  )
}

export default function AuthorsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthorsPageContent />
    </Suspense>
  )
}