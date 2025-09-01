'use client'

import { useCallback, useState } from 'react'
import { useDropzone, Accept } from 'react-dropzone'
import { Upload, X, FileImage, FileVideo, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MediaUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: 'image' | 'video' | 'all'
  multiple?: boolean
  maxSize?: number // in MB
}

export function MediaUploader({ 
  onUpload, 
  accept = 'all',
  multiple = true,
  maxSize = 100 
}: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Get accepted file types
  const getAcceptedTypes = (): Accept => {
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

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        const errors = rejection.errors.map((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              return `File is too large (max ${maxSize}MB)`
            case 'file-invalid-type':
              return 'File type not supported'
            default:
              return error.message
          }
        })
        return `${rejection.file.name}: ${errors.join(', ')}`
      })
      
      console.warn('Rejected files:', errors)
    }

    // Add accepted files
    if (multiple) {
      setFiles(prevFiles => [...prevFiles, ...acceptedFiles])
    } else {
      setFiles(acceptedFiles.slice(0, 1))
    }
  }, [maxSize, multiple])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    multiple,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    disabled: uploading
  })

  const removeFile = useCallback((index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await onUpload(files)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Clear files after successful upload
      setTimeout(() => {
        setFiles([])
        setUploadProgress(0)
      }, 1000)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }, [files, onUpload])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-6 h-6 text-blue-500" />
    } else if (file.type.startsWith('video/')) {
      return <FileVideo className="w-6 h-6 text-purple-500" />
    } else {
      return <FileIcon className="w-6 h-6 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              {accept === 'image' && 'Images only'}
              {accept === 'video' && 'Videos only'}
              {accept === 'all' && 'Images and videos'}
              {' • Max size: '}{maxSize}MB
              {multiple && ' • Multiple files allowed'}
            </p>
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          <div className="max-h-48 overflow-auto space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-48">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={uploading}
          >
            Clear All
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      )}
    </div>
  )
}