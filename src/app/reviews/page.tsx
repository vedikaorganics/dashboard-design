"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
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
import { MoreHorizontal, Star, Eye, Check, X, Flag, Clock, Save, Edit3 } from "lucide-react"
import { useReviews } from "@/hooks/use-data"
import { StarRating } from "@/components/ui/star-rating"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

const getStatusBadge = (isApproved: boolean) => {
  return isApproved ? (
    <Badge className="bg-success/20 text-success">Approved</Badge>
  ) : (
    <Badge className="bg-warning/20 text-warning">Pending</Badge>
  )
}

// Approval status filter options
const approvalStatusOptions = [
  { value: 'true', label: 'Approved', icon: Check },
  { value: 'false', label: 'Pending', icon: Clock }
]

// Rating filter options
const ratingOptions = [
  { value: '5', label: '5 Stars', icon: Star },
  { value: '4', label: '4 Stars', icon: Star },
  { value: '3', label: '3 Stars', icon: Star },
  { value: '2', label: '2 Stars', icon: Star },
  { value: '1', label: '1 Star', icon: Star }
]

export default function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [approvedFilter, setApprovedFilter] = useState<boolean | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string[]>([])
  const [ratingFilter, setRatingFilter] = useState<string[]>([])
  const [editingSortOrderId, setEditingSortOrderId] = useState<string | null>(null)
  const [editingSortOrderValue, setEditingSortOrderValue] = useState<string>('')
  const [isSavingSortOrder, setIsSavingSortOrder] = useState<boolean>(false)
  
  const { data: reviewsData, mutate } = useReviews(
    currentPage, 
    pageSize, 
    approvedFilter,
    searchQuery,
    ratingFilter
  )
  
  const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPageSize)
  }
  
  // Handle filter changes - reset to page 1 when filters change
  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setCurrentPage(1)
  }
  
  const handleApprovalStatusChange = (status: string[]) => {
    setApprovalStatusFilter(status)
    // Convert to boolean filter for backwards compatibility
    if (status.length === 1) {
      setApprovedFilter(status[0] === 'true')
    } else {
      setApprovedFilter(undefined)
    }
    setCurrentPage(1)
  }
  
  const handleRatingChange = (ratings: string[]) => {
    setRatingFilter(ratings)
    setCurrentPage(1)
  }

  const handleEditSortOrder = (review: any) => {
    setEditingSortOrderId(review._id)
    setEditingSortOrderValue(review.sortOrder?.toString() || '0')
  }

  const handleSaveSortOrder = async (reviewId: string) => {
    const numericValue = parseInt(editingSortOrderValue)
    if (isNaN(numericValue)) {
      alert('Please enter a valid number')
      return
    }

    setIsSavingSortOrder(true)
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sortOrder: numericValue })
      })
      
      if (response.ok) {
        setEditingSortOrderId(null)
        setEditingSortOrderValue('')
        // Refresh data
        mutate()
      } else {
        alert('Failed to update sort order')
      }
    } catch (error) {
      console.error('Failed to update sort order:', error)
      alert('Failed to update sort order')
    } finally {
      setIsSavingSortOrder(false)
    }
  }

  const handleCancelSortOrderEdit = () => {
    setEditingSortOrderId(null)
    setEditingSortOrderValue('')
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
    accessorKey: "author",
    header: "Customer",
    cell: ({ row }) => {
      const review = row.original
      const authorName = review.author || 'Anonymous'
      const initials = authorName.split(' ').map((n: string) => n[0] || '').join('') || 'A'
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm">{authorName}</div>
            <div className="text-xs text-muted-foreground">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '-'}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => {
      const review = row.original
      const productName = review.product?.title || review.product || 'Unknown Product'
      return (
        <div>
          <div className="text-sm">{productName}</div>
          <div className="text-xs text-muted-foreground">#{review._id}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number
      return (
        <div className="flex items-center space-x-2">
          <StarRating rating={rating} />
          <span className="text-sm">{rating}/5</span>
        </div>
      )
    },
  },
  {
    accessorKey: "text",
    header: "Review",
    cell: ({ row }) => {
      const review = row.original
      return (
        <div className="max-w-md">
          <div className="text-xs text-muted-foreground line-clamp-3">
            {review.text}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "isApproved",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.getValue("isApproved")),
  },
  {
    accessorKey: "helpful",
    header: "Helpful",
    cell: ({ row }) => {
      const helpful = row.getValue("helpful") as number
      return (
        <div className="text-center">
          <div className="text-sm">{helpful}</div>
          <div className="text-xs text-muted-foreground">votes</div>
        </div>
      )
    },
  },
  {
    accessorKey: "sortOrder",
    header: "Sort Order",
    cell: ({ row }) => {
      const review = row.original
      const sortOrder = row.getValue("sortOrder") as number || 0
      const isEditing = editingSortOrderId === review._id
      const isSaving = isSavingSortOrder && editingSortOrderId === review._id
      
      if (isEditing) {
        return (
          <div className="flex items-center gap-2 min-w-24">
            <Input
              type="number"
              value={editingSortOrderValue}
              onChange={(e) => setEditingSortOrderValue(e.target.value)}
              className="h-7 w-16 text-center"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => handleSaveSortOrder(review._id)}
              disabled={isSaving}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleCancelSortOrderEdit}
              disabled={isSaving}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      }
      
      return (
        <div 
          className="flex items-center gap-1 cursor-pointer group hover:bg-muted/50 -m-2 p-2 rounded min-w-16 justify-center"
          onClick={() => handleEditSortOrder(review)}
        >
          <span className="text-sm text-center">{sortOrder}</span>
          <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const review = row.original
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
            {!review.isApproved ? (
              <DropdownMenuItem>
                <Check className="mr-2 h-4 w-4" />
                Approve review
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
                <X className="mr-2 h-4 w-4" />
                Unapprove review
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Flag className="mr-2 h-4 w-4" />
              Report review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
  
  const reviews = (reviewsData as any)?.reviews || []
  const pagination = (reviewsData as any)?.pagination || {}
  
  return (
    <DashboardLayout title="Reviews">
      <div className="flex-1 space-y-6">
        
        <DataTable 
          columns={columns} 
          data={reviews}
          searchKey="author"
          searchPlaceholder="Search by author, review text, product, or review ID..."
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          filterableColumns={[
            {
              id: "isApproved",
              title: "Approval Status",
              options: approvalStatusOptions,
              value: approvalStatusFilter,
              onChange: handleApprovalStatusChange
            },
            {
              id: "rating",
              title: "Rating",
              options: ratingOptions,
              value: ratingFilter,
              onChange: handleRatingChange
            }
          ]}
          manualPagination={true}
          manualFiltering={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={(currentPage - 1) || 0}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </DashboardLayout>
  )
}