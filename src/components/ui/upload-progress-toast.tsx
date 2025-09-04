'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UploadProgress {
  id: string
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  type: 'image' | 'video'
  errorMessage?: string
}

interface UploadProgressToastProps {
  uploads: Map<string, UploadProgress>
  onDismiss: (id: string) => void
}

export function UploadProgressToast({ uploads, onDismiss }: UploadProgressToastProps) {
  const [visible, setVisible] = useState(false)
  const uploadsArray = Array.from(uploads.values())
  
  useEffect(() => {
    setVisible(uploadsArray.length > 0)
  }, [uploadsArray.length])

  if (!visible || uploadsArray.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md">
      {uploadsArray.map((upload) => (
        <div
          key={upload.id}
          className="bg-background border border-border rounded-lg p-4 shadow-lg min-w-[320px] animate-in slide-in-from-right-2"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="text-lg flex-shrink-0">
                {upload.status === 'completed' ? '✅' : 
                 upload.status === 'error' ? '❌' : 
                 upload.type === 'image' ? '🖼️' : '🎥'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate" title={upload.filename}>
                  {upload.filename}
                </p>
                <p className={`text-xs ${
                  upload.status === 'completed' ? 'text-green-600' :
                  upload.status === 'error' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {upload.status === 'completed' ? 'Upload completed' :
                   upload.status === 'error' ? (upload.errorMessage || 'Upload failed') :
                   'Uploading...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-sm font-mono">
                {upload.progress}%
              </span>
              {(upload.status === 'completed' || upload.status === 'error') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onDismiss(upload.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                upload.status === 'completed' ? 'bg-green-600' :
                upload.status === 'error' ? 'bg-red-600' :
                'bg-blue-600'
              }`}
              style={{ width: `${upload.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}