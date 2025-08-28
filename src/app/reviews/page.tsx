"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useUrlState, useUrlPagination, useUrlSearchState, useUrlStateMultiple } from "@/hooks/use-url-state"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

function ReviewsPageContent() {
  const [approvedFilter, setApprovedFilter] = useState<boolean | undefined>(undefined)
  const [editingSortOrderId, setEditingSortOrderId] = useState<string | null>(null)
  const [editingSortOrderValue, setEditingSortOrderValue] = useState<string>('')
  const [isSavingSortOrder, setIsSavingSortOrder] = useState<boolean>(false)
  const [selectedReview, setSelectedReview] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  
  // URL state management
  const [searchQuery, setSearchQuery] = useUrlSearchState("search", 300)
  const [approvalStatusFilter, setApprovalStatusFilter] = useUrlState<string[]>("status", [])
  const [ratingFilter, setRatingFilter] = useUrlState<string[]>("rating", [])
  const { page, pageSize, pageIndex, setPagination } = useUrlPagination(10)
  const { clearAll } = useUrlStateMultiple()
  
  const { data: reviewsData, isLoading, mutate } = useReviews(
    page, 
    pageSize, 
    approvedFilter,
    searchQuery,
    ratingFilter
  )
  
  const handlePaginationChange = setPagination
  
  // Handle filter changes
  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
  }
  
  const handleApprovalStatusChange = (status: string[]) => {
    setApprovalStatusFilter(status)
    // Convert to boolean filter for backwards compatibility
    if (status.length === 1) {
      setApprovedFilter(status[0] === 'true')
    } else {
      setApprovedFilter(undefined)
    }
  }
  
  const handleRatingChange = (ratings: string[]) => {
    setRatingFilter(ratings)
  }

  const handleClearAll = () => {
    // Clear all filter parameters but keep pagination
    clearAll(['page', 'limit'])
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

  const handleViewDetails = (review: any) => {
    setSelectedReview(review)
    setIsDialogOpen(true)
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
          <Avatar className="h-6 w-6">
            {review.avatar && (
              <AvatarImage src={review.avatar} alt={authorName || 'User avatar'} />
            )}
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">{authorName}</div>
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
        <div className="text-sm">{productName}</div>
      )
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number
      return (
        <div className="flex items-center">
          <StarRating rating={rating} showRating={false} />
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
    accessorKey: "photos",
    header: "Photos",
    cell: ({ row }) => {
      const review = row.original
      const photos = review.photos || []
      
      if (photos.length === 0) {
        return <span className="text-xs text-muted-foreground">None</span>
      }
      
      return (
        <div className="flex items-center gap-1">
          {photos.slice(0, 3).map((photo: string, index: number) => (
            <div
              key={index}
              className="relative w-8 h-8 rounded-md overflow-hidden bg-muted"
            >
              <img
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
          {photos.length > 3 && (
            <span className="text-xs text-muted-foreground ml-1">
              +{photos.length - 3}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const review = row.original
      return (
        <div className="text-sm">
          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }) : '-'}
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
            <DropdownMenuItem onClick={() => handleViewDetails(review)}>
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
          isLoading={isLoading}
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
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
          onClearAll={handleClearAll}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Details</DialogTitle>
            </DialogHeader>
            
            {selectedReview && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      {selectedReview.avatar && (
                        <AvatarImage src={selectedReview.avatar} alt={selectedReview.author || 'User avatar'} />
                      )}
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {(selectedReview.author || 'Anonymous').split(' ').map((n: string) => n[0] || '').join('') || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedReview.author || 'Anonymous'}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Information */}
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">{selectedReview.product?.title || selectedReview.product || 'Unknown Product'}</div>
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Rating</h4>
                  <div className="flex items-center space-x-3">
                    <StarRating rating={selectedReview.rating} showRating={false} />
                    {selectedReview.rating < 4 && (
                      <Badge variant={selectedReview.rating >= 3 ? 'secondary' : 'destructive'}>
                        {selectedReview.rating >= 3 ? 'Neutral' : 'Negative'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Review</h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedReview.text || 'No review text provided.'}
                    </p>
                  </div>
                </div>

                {/* Photos */}
                {selectedReview.photos && selectedReview.photos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Photos ({selectedReview.photos.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedReview.photos.map((photo: string, index: number) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
                          onClick={() => window.open(photo, '_blank')}
                        >
                          <img
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Status</h4>
                  {getStatusBadge(selectedReview.isApproved)}
                </div>

                {/* Additional Information */}
                {(selectedReview.updatedAt || selectedReview.verified) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedReview.updatedAt && (
                        <div>
                          <span className="font-medium">Last updated: </span>
                          <span className="text-muted-foreground">
                            {new Date(selectedReview.updatedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {selectedReview.verified && (
                        <div>
                          <span className="font-medium">Verified purchase: </span>
                          <Badge variant="secondary">Verified</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewsPageContent />
    </Suspense>
  )
}