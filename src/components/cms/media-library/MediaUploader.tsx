'use client'

import { useCallback, useState } from 'react'
import { useDropzone, Accept } from 'react-dropzone'
import * as UpChunk from '@mux/upchunk'
import { Upload, X, FileImage, FileVideo, File as FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useUploadToasts } from '@/hooks/use-upload-toasts'
import { UploadProgressToast } from '@/components/ui/upload-progress-toast'

interface MediaUploaderProps {
  onUpload: (files: File[]) => Promise<void>
  accept?: 'image' | 'video' | 'all'
  multiple?: boolean
  maxSize?: number // in MB
  currentFolderPath?: string
}

export function MediaUploader({ 
  onUpload, 
  accept = 'all',
  multiple = true,
  maxSize = 100,
  currentFolderPath = '/'
}: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [fileStatus, setFileStatus] = useState<Record<string, 'pending' | 'uploading' | 'completed' | 'error'>>({})
  
  // Upload toast system
  const { uploads, createUploadToast, updateUploadProgress, completeUpload, errorUpload, dismissUpload } = useUploadToasts()

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

  const uploadImageToServer = async (file: File, toastId: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('alt', file.name.split('.')[0])
    formData.append('caption', '')
    formData.append('tags', '')
    
    if (currentFolderPath !== '/') {
      formData.append('folderPath', currentFolderPath)
    }

    // Track upload progress using XMLHttpRequest for progress events
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          updateUploadProgress(toastId, progress)
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (error) {
            reject(new Error('Invalid response format'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.error || 'Image upload failed'))
          } catch {
            reject(new Error('Image upload failed'))
          }
        }
      }
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'))
      }
      
      xhr.open('POST', '/api/cms/media')
      xhr.send(formData)
    })
  }

  const uploadVideoToMux = async (file: File, toastId: string) => {
    
    // Step 1: Get upload URL from our API
    const uploadUrlResponse = await fetch('/api/cms/media/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        folderPath: currentFolderPath !== '/' ? currentFolderPath : null,
        alt: file.name.split('.')[0],
        caption: '',
        tags: [],
        fileSize: file.size // Pass original file size
      })
    })

    if (!uploadUrlResponse.ok) {
      throw new Error('Failed to get upload URL')
    }

    const { data } = await uploadUrlResponse.json()
    const { uploadUrl, uploadId } = data

    // Step 2: Upload directly to Mux using UpChunk
    return new Promise((resolve, reject) => {
      const upload = UpChunk.createUpload({
        endpoint: uploadUrl,
        file,
        chunkSize: 5120 // 5MB chunks
      })

      upload.on('progress', (progress) => {
        const fileKey = `${file.name}-${file.size}`
        const progressPercent = Math.round(progress.detail)
        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: progressPercent
        }))
        
        // Update toast progress
        updateUploadProgress(toastId, progressPercent)
      })

      upload.on('success', async () => {
        try {
          // Step 3: Notify our server that upload is complete
          const completeResponse = await fetch('/api/cms/media/complete-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId })
          })

          if (!completeResponse.ok) {
            throw new Error('Failed to complete upload')
          }

          const result = await completeResponse.json()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      upload.on('error', (error) => {
        reject(new Error(`Upload failed: ${error.detail}`))  
      })
    })
  }

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return

    setUploading(true)
    
    // Initialize status for all files
    const initialStatus = files.reduce((acc, file) => {
      const fileKey = `${file.name}-${file.size}`
      return { ...acc, [fileKey]: 'uploading' as const }
    }, {})
    setFileStatus(initialStatus)

    // Create toast for each file
    const fileToastMap = new Map<string, string>()
    files.forEach(file => {
      const fileKey = `${file.name}-${file.size}`
      const toastId = createUploadToast(file)
      fileToastMap.set(fileKey, toastId)
    })

    try {
      // Separate images and videos
      const images = files.filter(f => f.type.startsWith('image/'))
      const videos = files.filter(f => f.type.startsWith('video/'))

      const uploadPromises: Promise<any>[] = []

      // Upload images via FormData (existing flow)
      if (images.length > 0) {
        uploadPromises.push(
          ...images.map(async (file) => {
            const fileKey = `${file.name}-${file.size}`
            const toastId = fileToastMap.get(fileKey)!
            try {
              const result = await uploadImageToServer(file, toastId)
              setFileStatus(prev => ({ ...prev, [fileKey]: 'completed' }))
              setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))
              completeUpload(toastId)
              return result
            } catch (error) {
              setFileStatus(prev => ({ ...prev, [fileKey]: 'error' }))
              errorUpload(toastId, error instanceof Error ? error.message : 'Upload failed')
              throw error
            }
          })
        )
      }

      // Upload videos directly to Mux
      if (videos.length > 0) {
        uploadPromises.push(
          ...videos.map(async (file) => {
            const fileKey = `${file.name}-${file.size}`
            const toastId = fileToastMap.get(fileKey)!
            try {
              const result = await uploadVideoToMux(file, toastId)
              setFileStatus(prev => ({ ...prev, [fileKey]: 'completed' }))
              setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))
              completeUpload(toastId)
              return result
            } catch (error) {
              setFileStatus(prev => ({ ...prev, [fileKey]: 'error' }))
              errorUpload(toastId, error instanceof Error ? error.message : 'Upload failed')
              throw error
            }
          })
        )
      }

      // Wait for all uploads to complete
      const results = await Promise.allSettled(uploadPromises)
      
      const successes = results.filter(result => result.status === 'fulfilled').length
      const failures = results.filter(result => result.status === 'rejected').length
      
      if (successes > 0 && failures === 0) {
        // All succeeded - don't show additional toast as individual toasts will show success
      } else if (successes > 0 && failures > 0) {
        toast.warning(`${successes} file(s) uploaded, ${failures} failed`)
      } else if (failures > 0) {
        toast.error(`${failures} upload(s) failed`)
      }
      
      // Clear files after upload attempt
      setTimeout(() => {
        setFiles([])
        setUploadProgress({})
        setFileStatus({})
      }, 2000)
      
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload process failed')
    } finally {
      setUploading(false)
      
      // Trigger refresh after uploads
      if (onUpload) {
        onUpload(files).catch(console.error)
      }
    }
  }, [files, currentFolderPath, createUploadToast, completeUpload, errorUpload, onUpload])

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
    <>
      <UploadProgressToast uploads={uploads} onDismiss={dismissUpload} />
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
      {uploading && files.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Upload Progress</p>
          {files.map((file, index) => {
            const fileKey = `${file.name}-${file.size}`
            const progress = uploadProgress[fileKey] || 0
            const status = fileStatus[fileKey] || 'pending'
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate max-w-48">{file.name}</span>
                  <span className="flex items-center space-x-2">
                    {status === 'completed' && '✅'}
                    {status === 'error' && '❌'}
                    <span>{progress}%</span>
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-1",
                    status === 'completed' && "bg-green-100",
                    status === 'error' && "bg-red-100"
                  )} 
                />
              </div>
            )
          })}
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
    </>
  )
}