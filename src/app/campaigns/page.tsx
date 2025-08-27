"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MoreHorizontal, Plus, Edit, Trash2, Copy, Link, ExternalLink, Check } from "lucide-react"
import { useCampaigns, useProducts } from "@/hooks/use-data"
import { getPaymentServerUrl } from "@/lib/env"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"


interface Campaign {
  _id: string
  shortId: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  createdAt: string
  updatedAt: string
}

interface CampaignFormData {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
}

const getChannelBadge = (source: string, medium: string) => {
  const channelKey = `${source}-${medium}`.toLowerCase()
  
  if (channelKey.includes('call')) {
    return <Badge className="bg-blue-100 text-blue-800">Phone</Badge>
  }
  if (channelKey.includes('whatsapp')) {
    return <Badge className="bg-green-100 text-green-800">WhatsApp</Badge>
  }
  if (channelKey.includes('google')) {
    return <Badge className="bg-red-100 text-red-800">Google</Badge>
  }
  if (channelKey.includes('facebook')) {
    return <Badge className="bg-blue-100 text-blue-800">Facebook</Badge>
  }
  if (channelKey.includes('instagram')) {
    return <Badge className="bg-pink-100 text-pink-800">Instagram</Badge>
  }
  return <Badge variant="outline">Other</Badge>
}

export default function CampaignsPage() {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [selectedCampaignForCopy, setSelectedCampaignForCopy] = useState<Campaign | null>(null)
  const [createFormData, setCreateFormData] = useState<CampaignFormData>({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  })
  
  const [editFormData, setEditFormData] = useState<CampaignFormData>({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  })
  
  const handlePaginationChange = ({ pageIndex, pageSize: newPageSize }: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(pageIndex + 1) // Convert 0-based to 1-based
    setPageSize(newPageSize)
  }
  
  const handleSearchChange = (search: string) => {
    setSearchQuery(search)
    setCurrentPage(1) // Reset to first page when searching
  }
  
  const copyPageUrl = async (shortId: string, pagePath: string) => {
    // Convert "/" back to empty string for the URL
    const urlPath = pagePath === "/" ? "" : pagePath
    const baseUrl = getPaymentServerUrl()
    const url = `${baseUrl}/r/${shortId}${urlPath}`
    await navigator.clipboard.writeText(url)
    setCopiedId(shortId)
    setTimeout(() => setCopiedId(null), 2000)
    setCopyDialogOpen(false)
  }

  const openCopyDialog = (campaign: Campaign) => {
    setSelectedCampaignForCopy(campaign)
    setCopyDialogOpen(true)
  }
  
  const handleCreate = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData)
      })
      
      if (response.ok) {
        setIsCreateDialogOpen(false)
        setCreateFormData({ utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '' })
        setCurrentPage(1) // Reset to first page to see new campaign
        // Force re-fetch by changing a dependency
        setSearchQuery(searchQuery === '' ? ' ' : '')
        setTimeout(() => setSearchQuery(''), 100)
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    }
  }
  
  const handleUpdate = async () => {
    if (!selectedCampaign) return
    
    try {
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: selectedCampaign._id, ...editFormData })
      })
      
      if (response.ok) {
        setIsEditDialogOpen(false)
        setSelectedCampaign(null)
        setEditFormData({ utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '' })
        // Force re-fetch by changing a dependency
        setSearchQuery(searchQuery === '' ? ' ' : '')
        setTimeout(() => setSearchQuery(''), 100)
      }
    } catch (error) {
      console.error('Error updating campaign:', error)
    }
  }
  
  const handleDelete = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns?_id=${campaignId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Force re-fetch by changing a dependency
        setSearchQuery(searchQuery === '' ? ' ' : '')
        setTimeout(() => setSearchQuery(''), 100)
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }
  
  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setEditFormData({
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      utm_content: campaign.utm_content,
      utm_term: campaign.utm_term
    })
    setIsEditDialogOpen(true)
  }
  
  const columns: ColumnDef<Campaign>[] = [
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
      accessorKey: "shortId",
      header: "Short ID",
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <div className="group flex items-center space-x-2">
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{campaign.shortId}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(campaign.shortId)
                setCopiedId(campaign.shortId)
                setTimeout(() => setCopiedId(null), 2000)
              }}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copiedId === campaign.shortId ? 
                <Check className="h-3 w-3 text-green-600" /> : 
                <Copy className="h-3 w-3" />
              }
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "utm_source",
      header: "Source",
      cell: ({ row }) => {
        const source = row.getValue("utm_source") as string
        return (
          <div>
            {source || "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "utm_medium",
      header: "Medium",
      cell: ({ row }) => {
        const medium = row.getValue("utm_medium") as string
        return (
          <div>
            {medium || "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "utm_campaign",
      header: "Campaign",
      cell: ({ row }) => {
        const campaign = row.getValue("utm_campaign") as string
        return (
          <div>
            {campaign || "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "utm_content",
      header: "Content",
      cell: ({ row }) => {
        const content = row.getValue("utm_content") as string
        return (
          <div className="max-w-[150px] truncate">
            {content || "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "utm_term",
      header: "Term",
      cell: ({ row }) => {
        const term = row.getValue("utm_term") as string
        return (
          <div className="max-w-[150px] truncate">
            {term || "-"}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const campaign = row.original
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
              <DropdownMenuItem onClick={() => openCopyDialog(campaign)}>
                <Link className="mr-2 h-4 w-4" />
                Copy page URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`${getPaymentServerUrl()}/r/${campaign.shortId}`, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Test URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit campaign
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete campaign
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this campaign? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(campaign._id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
  
  const { data: campaignsData, isLoading } = useCampaigns(
    currentPage,
    pageSize,
    searchQuery
  )
  
  const { data: productsData } = useProducts()
  
  const campaigns = (campaignsData as any)?.campaigns || []
  const pagination = (campaignsData as any)?.pagination || {}
  const summary = (campaignsData as any)?.summary || {}
  
  const products = (productsData as any)?.products || []
  
  const totalCampaigns = summary.totalCampaigns || 0
  
  return (
    <DashboardLayout title="Campaign Management">
      <div className="flex-1 space-y-4">
        <DataTable 
          columns={columns} 
          data={campaigns}
          isLoading={isLoading}
          searchKey="utm_campaign"
          searchPlaceholder="Search campaigns..."
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          manualPagination={true}
          manualFiltering={true}
          pageCount={pagination.totalPages || 0}
          pageIndex={(currentPage - 1) || 0}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
          toolbarActions={
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Create a new short URL campaign with UTM parameters.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="utm_source">UTM Source *</Label>
                    <Input
                      id="utm_source"
                      value={createFormData.utm_source}
                      onChange={(e) => setCreateFormData({ ...createFormData, utm_source: e.target.value })}
                      placeholder="e.g., google, facebook, newsletter"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="utm_medium">UTM Medium *</Label>
                    <Input
                      id="utm_medium"
                      value={createFormData.utm_medium}
                      onChange={(e) => setCreateFormData({ ...createFormData, utm_medium: e.target.value })}
                      placeholder="e.g., cpc, banner, email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="utm_campaign">UTM Campaign *</Label>
                    <Input
                      id="utm_campaign"
                      value={createFormData.utm_campaign}
                      onChange={(e) => setCreateFormData({ ...createFormData, utm_campaign: e.target.value })}
                      placeholder="e.g., summer_sale, product_launch"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="utm_content">UTM Content</Label>
                    <Input
                      id="utm_content"
                      value={createFormData.utm_content}
                      onChange={(e) => setCreateFormData({ ...createFormData, utm_content: e.target.value })}
                      placeholder="e.g., logolink, textlink"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="utm_term">UTM Term</Label>
                    <Input
                      id="utm_term"
                      value={createFormData.utm_term}
                      onChange={(e) => setCreateFormData({ ...createFormData, utm_term: e.target.value })}
                      placeholder="e.g., running+shoes"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!createFormData.utm_source || !createFormData.utm_medium || !createFormData.utm_campaign}>
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription>
                Update UTM parameters for campaign {selectedCampaign?.shortId}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_utm_source">UTM Source *</Label>
                <Input
                  id="edit_utm_source"
                  value={editFormData.utm_source}
                  onChange={(e) => setEditFormData({ ...editFormData, utm_source: e.target.value })}
                  placeholder="e.g., google, facebook, newsletter"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_utm_medium">UTM Medium *</Label>
                <Input
                  id="edit_utm_medium"
                  value={editFormData.utm_medium}
                  onChange={(e) => setEditFormData({ ...editFormData, utm_medium: e.target.value })}
                  placeholder="e.g., cpc, banner, email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_utm_campaign">UTM Campaign *</Label>
                <Input
                  id="edit_utm_campaign"
                  value={editFormData.utm_campaign}
                  onChange={(e) => setEditFormData({ ...editFormData, utm_campaign: e.target.value })}
                  placeholder="e.g., summer_sale, product_launch"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_utm_content">UTM Content</Label>
                <Input
                  id="edit_utm_content"
                  value={editFormData.utm_content}
                  onChange={(e) => setEditFormData({ ...editFormData, utm_content: e.target.value })}
                  placeholder="e.g., logolink, textlink"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_utm_term">UTM Term</Label>
                <Input
                  id="edit_utm_term"
                  value={editFormData.utm_term}
                  onChange={(e) => setEditFormData({ ...editFormData, utm_term: e.target.value })}
                  placeholder="e.g., running+shoes"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!editFormData.utm_source || !editFormData.utm_medium || !editFormData.utm_campaign}>
                Update Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Copy Page URL Dialog */}
        <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Copy URL - <span className="font-mono">{selectedCampaignForCopy?.shortId}</span></DialogTitle>
            </DialogHeader>
            <div className="space-y-1">
              <button
                className="w-full text-left p-2 hover:bg-muted rounded text-xs font-mono cursor-pointer"
                onClick={() => copyPageUrl(selectedCampaignForCopy?.shortId || "", "/")}
              >
                {getPaymentServerUrl()}/r/{selectedCampaignForCopy?.shortId}
              </button>
              
              <button
                className="w-full text-left p-2 hover:bg-muted rounded text-xs font-mono cursor-pointer"
                onClick={() => copyPageUrl(selectedCampaignForCopy?.shortId || "", "/shop")}
              >
                {getPaymentServerUrl()}/r/{selectedCampaignForCopy?.shortId}/shop
              </button>
              
              {products.map((product: any) => (
                <button
                  key={product.id}
                  className="w-full text-left p-2 hover:bg-muted rounded text-xs font-mono cursor-pointer"
                  onClick={() => copyPageUrl(selectedCampaignForCopy?.shortId || "", `/shop/${product.id}`)}
                >
                  {getPaymentServerUrl()}/r/{selectedCampaignForCopy?.shortId}/shop/{product.id}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}