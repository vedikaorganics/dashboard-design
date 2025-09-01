'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, FileVideo, X } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { MediaAsset } from '@/types/cms'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MediaDropZoneProps {
  accept?: 'image' | 'video' | 'all'
  maxFiles?: number
  onUpload?: (assets: MediaAsset[]) => void
  onUploadStart?: () => void
  onUploadEnd?: () => void
  className?: string
  children?: React.ReactNode
  disabled?: boolean
}

export function MediaDropZone({
  accept = 'all',
  maxFiles = 1,
  onUpload,
  onUploadStart,
  onUploadEnd,
  className,
  children,
  disabled = false
}: MediaDropZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])

  // Get accepted file types
  const getAcceptedTypes = (): Record<string, string[]> => {
    switch (accept) {
      case 'image':
        return { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] }
      case 'video':
        return { 'video/*': ['.mp4', '.webm', '.ogg', '.mov'] }
      default:
        return {
          'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
          'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
        }
    }
  }

  const handleUpload = useCallback(async (files: File[]) => {
    if (disabled) return

    setUploading(true)
    setUploadingFiles(files)
    setUploadProgress(0)
    onUploadStart?.()

    const uploadedAssets: MediaAsset[] = []
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Update progress
        setUploadProgress(((i + 0.5) / files.length) * 100)

        // Validate file type based on accept prop
        if (accept !== 'all') {
          if (accept === 'image' && !file.type.startsWith('image/')) {
            throw new Error(`Only images are allowed. ${file.name} is not an image.`)
          }
          if (accept === 'video' && !file.type.startsWith('video/')) {
            throw new Error(`Only videos are allowed. ${file.name} is not a video.`)
          }
        }
        
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('alt', file.name.split('.')[0]) // Remove extension for alt text
        formData.append('caption', '')
        formData.append('tags', '')
        
        // Upload directly to API
        const response = await fetch('/api/cms/media', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || `Upload failed for ${file.name}`)
        }
        
        const result = await response.json()
        uploadedAssets.push(result.data)
        
        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      toast.success(`${files.length} file(s) uploaded successfully`)
      onUpload?.(uploadedAssets)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload files')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      setUploadingFiles([])
      setUploadProgress(0)
      onUploadEnd?.()
    }
  }, [accept, disabled, onUpload, onUploadStart, onUploadEnd])

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        return rejection.errors.map((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              return `${rejection.file.name} is too large (max 100MB)`
            case 'file-invalid-type':
              return `${rejection.file.name} is not a valid ${accept === 'all' ? 'media' : accept} file`
            case 'too-many-files':
              return `Too many files. Maximum ${maxFiles} allowed.`
            default:
              return `Error with ${rejection.file.name}: ${error.message}`
          }
        })
      }).flat()

      errors.forEach(error => toast.error(error))
      return
    }

    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles)
    }
  }, [handleUpload, accept, maxFiles])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    maxFiles,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: disabled || uploading,
    noClick: true // Disable click to open file dialog
  })

  const getIcon = () => {
    switch (accept) {
      case 'image':
        return <FileImage className="w-8 h-8" />
      case 'video':
        return <FileVideo className="w-8 h-8" />
      default:
        return <Upload className="w-8 h-8" />
    }
  }

  const getAcceptText = () => {
    switch (accept) {
      case 'image':
        return 'images'
      case 'video':
        return 'videos'
      default:
        return 'media files'
    }
  }

  if (uploading) {
    return (
      <div className={cn(
        'border-2 border-dashed border-muted rounded-lg p-8',
        'flex flex-col items-center justify-center space-y-4',
        'bg-muted/20',
        className
      )}>
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Uploading {uploadingFiles.length} file(s)...</h3>
          <div className="w-64">
            <Progress value={uploadProgress} className="h-2" />
          </div>
          <p className="text-sm text-muted-foreground">
            {Math.round(uploadProgress)}% complete
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors',
        'flex flex-col items-center justify-center space-y-4',
        isDragActive && !isDragReject && 'border-primary bg-primary/5',
        isDragReject && 'border-destructive bg-destructive/5',
        !isDragActive && !isDragReject && 'border-muted hover:border-primary/50 hover:bg-muted/20',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      
      {children || (
        <>
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            isDragActive && !isDragReject && 'bg-primary/10 text-primary',
            isDragReject && 'bg-destructive/10 text-destructive',
            !isDragActive && !isDragReject && 'bg-muted text-muted-foreground'
          )}>
            {getIcon()}
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="font-medium">
              {isDragActive
                ? isDragReject
                  ? 'Invalid file type'
                  : `Drop ${getAcceptText()} here`
                : `Upload ${getAcceptText()}`
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? isDragReject
                  ? `Only ${getAcceptText()} are allowed`
                  : 'Release to upload'
                : `Drag & drop ${getAcceptText()} here, or click to select`
              }
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-muted-foreground">
                Maximum {maxFiles} files, up to 100MB each
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}