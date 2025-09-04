'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import Hls from 'hls.js'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  autoplay?: boolean
  muted?: boolean
  controls?: boolean
  onLoad?: () => void
  onError?: (error: string) => void
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoplay = false,
  muted = false,
  controls = true,
  onLoad,
  onError
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const isHLS = src.includes('.m3u8')
    
    // Try native HLS support first (Safari and some other browsers)
    if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      onLoad?.()
    } else if (isHLS && Hls.isSupported()) {
      // Fallback to HLS.js for browsers without native HLS support
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
      })
      
      hlsRef.current = hls
      
      hls.loadSource(src)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        onLoad?.()
      })
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data)
        setError('Failed to load video')
        onError?.('Failed to load video')
      })
    } else {
      // Regular video file
      video.src = src
      onLoad?.()
    }

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, onLoad, onError])

  const handleError = () => {
    setError('Failed to load video')
    onError?.('Failed to load video')
  }

  if (error) {
    return (
      <div className={cn("relative bg-black flex items-center justify-center text-white", className)}>
        <p className="text-sm">Failed to load video</p>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      poster={poster}
      autoPlay={autoplay}
      muted={muted}
      controls={controls}
      playsInline
      onError={handleError}
      className={cn("w-full h-full object-contain bg-black", className)}
    />
  )
}