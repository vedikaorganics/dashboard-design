'use client'

import { useState, useCallback } from 'react'
import { 
  Search, 
  Upload, 
  FolderPlus, 
  Grid3X3, 
  List, 
  Images, 
  SlidersHorizontal,
  ChevronDown,
  X,
  Download,
  Trash2,
  Move,
  Tag,
  MoreHorizontal,
  LayoutGrid,
  LayoutList
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'date' | 'size' | 'type'
export type SortOrder = 'asc' | 'desc'

interface MediaHeaderProps {
  // Search and filters
  search: string
  onSearchChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  
  // View controls
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortBy: SortBy
  onSortByChange: (sort: SortBy) => void
  sortOrder: SortOrder
  onSortOrderChange: (order: SortOrder) => void
  
  // Selection and bulk actions
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkDelete: () => void
  onBulkDownload: () => void
  onBulkMove: () => void
  onBulkTag: () => void
  
  // Upload
  onUpload: (files: File[]) => void
  
  // Folder creation
  onCreateFolder: (name: string) => void
}

export function MediaHeader({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkDownload,
  onBulkMove,
  onBulkTag,
  onUpload,
  onCreateFolder
}: MediaHeaderProps) {
  const [showUploader, setShowUploader] = useState(false)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim())
      setNewFolderName('')
      setShowFolderDialog(false)
    }
  }, [newFolderName, onCreateFolder])

  const hasSelection = selectedCount > 0
  const isAllSelected = selectedCount === totalCount

  return (
    <div className="p-4 space-y-4">
      {/* Search and Actions Row */}
      <div className="flex items-center justify-between space-x-4">
        {/* Left Side - Search and Filters */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search media files..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(typeFilter !== 'all' && "bg-muted")}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {typeFilter !== 'all' && (
                  <Badge variant="secondary" className="ml-2 h-4 px-1.5">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel>Filter Media</DropdownMenuLabel>
              <div className="p-2 space-y-3">
                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">File Type</label>
                  <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Date Range Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Date Range</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="year">This year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* File Size Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">File Size</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Any size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
                      <SelectItem value="medium">Medium (1-10MB)</SelectItem>
                      <SelectItem value="large">Large (&gt; 10MB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Tags Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Tags</label>
                  <Input placeholder="Enter tags..." />
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    onTypeFilterChange('all')
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Create Folder Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFolderDialog(true)}
            className="h-9"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Folder
          </Button>

          {/* Upload Button */}
          <Button
            size="sm"
            onClick={() => setShowUploader(true)}
            className="h-9"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>

          {/* View Controls */}
          <div className="hidden md:flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="h-8 px-2 rounded-r-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="h-8 px-2 rounded-l-none"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => onSortByChange(value as SortBy)}>
                <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="date">Date Modified</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="type">Type</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortOrder === 'desc'}
                onCheckedChange={(checked) => onSortOrderChange(checked ? 'desc' : 'asc')}
              >
                Descending
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">
              {selectedCount} of {totalCount} selected
            </span>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={isAllSelected ? onClearSelection : onSelectAll}
                className="h-7"
              >
                {isAllSelected ? 'Clear All' : 'Select All'}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" onClick={onBulkDownload} className="h-7">
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={onBulkMove} className="h-7">
              <Move className="w-3 h-3 mr-1" />
              Move
            </Button>
            <Button variant="outline" size="sm" onClick={onBulkTag} className="h-7">
              <Tag className="w-3 h-3 mr-1" />
              Tag
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkDelete}
              className="h-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}


      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/40 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">Drag and drop files here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports images and videos up to 100MB each
              </p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files)
                    onUpload(files)
                    setShowUploader(false)
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder()
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFolderDialog(false)
                  setNewFolderName('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}