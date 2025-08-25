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
import { MoreHorizontal, Star, Eye, Check, X, Flag } from "lucide-react"
import { useReviews } from "@/hooks/use-data"
import { StarRating } from "@/components/ui/star-rating"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

const getStatusBadge = (isApproved: boolean) => {
  return isApproved ? (
    <Badge variant="default">Approved</Badge>
  ) : (
    <Badge variant="secondary">Pending</Badge>
  )
}

export default function ReviewsPage() {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [approvedFilter, setApprovedFilter] = useState<boolean | undefined>(undefined)
  
  const { data: reviewsData } = useReviews(currentPage, pageSize, approvedFilter)
  
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
    accessorKey: "author",
    header: "Customer",
    cell: ({ row }) => {
      const review = row.original
      const authorName = review.author || 'Anonymous'
      const initials = authorName.split(' ').map((n: string) => n[0] || '').join('') || 'A'
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-800">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">{authorName}</div>
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
          <div className="font-medium text-sm">{productName}</div>
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
          <span className="text-sm font-medium">{rating}/5</span>
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
          <div className="font-medium text-sm">{helpful}</div>
          <div className="text-xs text-muted-foreground">votes</div>
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
          searchPlaceholder="Search reviews..."
          manualPagination={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={(currentPage - 1) || 0}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </DashboardLayout>
  )
}