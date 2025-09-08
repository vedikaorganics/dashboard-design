'use client'

import { useMemo } from 'react'

export function useWordCount(text: string) {
  return useMemo(() => {
    if (!text || text.trim().length === 0) return 0
    
    // Remove extra whitespace and split by whitespace
    const words = text
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .split(' ')
      .filter(word => word.length > 0)
    
    return words.length
  }, [text])
}