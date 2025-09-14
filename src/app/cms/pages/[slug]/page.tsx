'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageBuilder } from '@/components/cms/page-builder/PageBuilder'
import { useCMSContentItem } from '@/hooks/cms/use-cms-content'

interface CMSPageEditPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function CMSPageEditPage({ params }: CMSPageEditPageProps) {
  const resolvedParams = use(params)
  const { slug } = resolvedParams
  const router = useRouter()

  // Convert 'home' route slug to empty string for homepage
  const actualSlug = slug === 'home' ? '' : slug
  const { content, isLoading, error, updateContent } = useCMSContentItem(actualSlug)

  const handleUpdate = async (updates: any) => {
    if (content) {
      await updateContent(updates)
    }
  }

  const handleSave = async () => {
    // The updateContent in the hook already saves
    // This is just for explicit save actions
    return Promise.resolve()
  }

  const handlePublish = async (publishAt?: Date) => {
    if (content) {
      await updateContent({
        status: 'published',
        publishedAt: publishAt || new Date(),
        ...(publishAt && { scheduledPublishAt: publishAt })
      })
    }
  }


  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading page...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !content) {
    return (
      <DashboardLayout title="Page Not Found">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-2">
              {error || 'Page not found'}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/cms/pages')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={content.title}>
      <div className="h-full flex flex-col">
        <PageBuilder
          content={content}
          onUpdate={handleUpdate}
          onSave={handleSave}
          onPublish={handlePublish}
          isLoading={isLoading}
          restrictToPageType={true}
        />
      </div>
    </DashboardLayout>
  )
}