"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AuthorForm } from "@/components/cms/authors/AuthorForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Author } from "@/types/authors"

export default function EditAuthorPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [author, setAuthor] = useState<Author | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        const response = await fetch(`/api/cms/authors/${slug}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Author not found')
          }
          throw new Error('Failed to fetch author')
        }
        
        const authorData = await response.json()
        setAuthor(authorData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load author')
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchAuthor()
    }
  }, [slug])

  const handleSave = (savedAuthor: Author) => {
    setAuthor(savedAuthor)
    // Optionally redirect back to authors list
    router.push('/cms/blog/authors')
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." requiredRole="admin">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading author...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !author) {
    return (
      <DashboardLayout title="Error" requiredRole="admin">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/cms/blog/authors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Authors
              </Link>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Error Loading Author</CardTitle>
              <CardDescription>
                {error || 'Author not found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/cms/blog/authors">
                  Return to Authors List
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`Edit ${author.displayName}`} requiredRole="admin">
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/cms/blog/authors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Authors
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit {author.displayName}</h1>
            <p className="text-muted-foreground">
              Update author profile information
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl">
          <AuthorForm 
            author={author} 
            onSave={handleSave}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}