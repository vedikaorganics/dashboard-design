'use client'

import { Clock, FileText, Save, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlogStatusBarProps {
  wordCount: number
  readingTime: number
  isSaving?: boolean
  lastSaved?: Date | null
  hasUnsavedChanges?: boolean
  className?: string
}

export function BlogStatusBar({
  wordCount,
  readingTime,
  isSaving = false,
  lastSaved,
  hasUnsavedChanges = false,
  className
}: BlogStatusBarProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getSentenceCount = (wordCount: number) => {
    // Rough estimate: average 15-20 words per sentence
    return Math.ceil(wordCount / 18)
  }

  const getReadabilityScore = (wordCount: number) => {
    // Simple readability indicator
    if (wordCount < 100) return { score: 'Getting started', color: 'text-muted-foreground' }
    if (wordCount < 500) return { score: 'Short read', color: 'text-blue-600' }
    if (wordCount < 1500) return { score: 'Medium read', color: 'text-green-600' }
    if (wordCount < 3000) return { score: 'Long read', color: 'text-orange-600' }
    return { score: 'Very long read', color: 'text-red-600' }
  }

  const readability = getReadabilityScore(wordCount)
  const sentenceCount = getSentenceCount(wordCount)

  return (
    <div className={cn(
      'border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'px-4 py-2',
      className
    )}>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {/* Left side - Writing statistics */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="font-medium text-foreground">{wordCount.toLocaleString()}</span>
            <span>words</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-foreground">{readingTime}</span>
            <span>min read</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-medium text-foreground">{sentenceCount}</span>
            <span>sentences</span>
          </div>

          <div className="hidden md:block">
            <span className={cn("font-medium", readability.color)}>
              {readability.score}
            </span>
          </div>
        </div>

        {/* Right side - Save status */}
        <div className="flex items-center gap-4">
          {/* Save indicator */}
          <div className="flex items-center gap-2">
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                <span className="text-primary">Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-orange-600">Unsaved changes</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">
                  {lastSaved ? `Saved at ${formatTime(lastSaved)}` : 'Saved'}
                </span>
              </>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="hidden lg:block text-xs border-l pl-4">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">Ctrl+S</kbd>
            <span className="ml-1">to save</span>
          </div>
        </div>
      </div>

      {/* Progress indicator for longer articles */}
      {wordCount > 100 && (
        <div className="mt-2">
          <div className="w-full bg-muted rounded-full h-1">
            <div 
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                wordCount < 300 ? "bg-blue-500" :
                wordCount < 800 ? "bg-green-500" :
                wordCount < 1500 ? "bg-yellow-500" :
                wordCount < 2500 ? "bg-orange-500" : "bg-red-500"
              )}
              style={{ 
                width: `${Math.min((wordCount / 2500) * 100, 100)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Short</span>
            <span>Medium</span>
            <span>Long</span>
          </div>
        </div>
      )}
    </div>
  )
}