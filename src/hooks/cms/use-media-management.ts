'use client'

import { useCallback } from 'react'
import { ContentBlock, getMediaAssetId, createMediaRef } from '@/types/cms'
import { MediaAsset } from '@/types/cms'

interface MediaUsage {
  blockId: string
  blockType: string
  fieldPath: string
  blockTitle: string
}

export function useMediaManagement() {

  // Find all blocks that use a specific media asset
  const findMediaUsage = useCallback((blocks: ContentBlock[], assetId: string): MediaUsage[] => {
    const usage: MediaUsage[] = []

    const getBlockTitle = (block: ContentBlock): string => {
      const content = block.content as any
      switch (block.type) {
        case 'video-cta':
          return content?.heading || 'Video CTA Block'
        case 'sliding-images-cta':
          return `Sliding Images (${content?.slides?.length || 0} slides)`
        case 'text':
          const text = content?.text?.replace(/<[^>]*>/g, '') // Strip HTML
          return text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'Text Block'
        case 'image':
          return content?.alt || 'Image Block'
        case 'gallery':
          return `Gallery (${content?.images?.length || 0} images)`
        case 'video':
          return 'Video Block'
        default:
          return `${block.type.replace('-', ' ')} Block`
      }
    }

    const checkMediaInContent = (content: any, blockId: string, blockType: string, blockTitle: string, path = '') => {
      if (!content) return

      // Check for media references in nested objects
      Object.keys(content).forEach(key => {
        const value = content[key]
        const currentPath = path ? `${path}.${key}` : key

        if (value && typeof value === 'object') {
          // Check if it's a media reference
          if ('url' in value && 'assetId' in value) {
            if (getMediaAssetId(value) === assetId) {
              usage.push({
                blockId,
                blockType,
                fieldPath: currentPath,
                blockTitle
              })
            }
          } else if (Array.isArray(value)) {
            // Check arrays
            value.forEach((item, index) => {
              if (item && typeof item === 'object') {
                checkMediaInContent(item, blockId, blockType, blockTitle, `${currentPath}[${index}]`)
              }
            })
          } else {
            // Recursively check nested objects
            checkMediaInContent(value, blockId, blockType, blockTitle, currentPath)
          }
        }
      })
    }

    blocks.forEach(block => {
      const blockTitle = getBlockTitle(block)
      checkMediaInContent(block.content, block.id, block.type, blockTitle)
    })

    return usage
  }, [])

  // Replace an asset across all blocks
  const replaceMediaAsset = useCallback((
    blocks: ContentBlock[],
    oldAssetId: string,
    newAsset: MediaAsset
  ): ContentBlock[] => {
    
    const replaceInContent = (content: any): any => {
      if (!content) return content

      if (Array.isArray(content)) {
        return content.map(item => replaceInContent(item))
      }

      if (typeof content === 'object') {
        const newContent = { ...content }
        
        Object.keys(newContent).forEach(key => {
          const value = newContent[key]
          
          if (value && typeof value === 'object') {
            // Check if it's a media reference that matches
            if ('url' in value && 'assetId' in value && getMediaAssetId(value) === oldAssetId) {
              newContent[key] = createMediaRef(newAsset.url, newAsset._id, newAsset.filename)
            } else {
              // Recursively replace in nested objects
              newContent[key] = replaceInContent(value)
            }
          }
        })
        
        return newContent
      }

      return content
    }

    return blocks.map(block => ({
      ...block,
      content: replaceInContent(block.content)
    }))
  }, [])

  // Remove an asset from all blocks (replace with undefined/null)
  const removeMediaAsset = useCallback((blocks: ContentBlock[], assetId: string): ContentBlock[] => {
    
    const removeFromContent = (content: any): any => {
      if (!content) return content

      if (Array.isArray(content)) {
        return content.map(item => removeFromContent(item))
      }

      if (typeof content === 'object') {
        const newContent = { ...content }
        
        Object.keys(newContent).forEach(key => {
          const value = newContent[key]
          
          if (value && typeof value === 'object') {
            // Check if it's a media reference that matches
            if ('url' in value && 'assetId' in value && getMediaAssetId(value) === assetId) {
              newContent[key] = undefined
            } else {
              // Recursively remove from nested objects
              newContent[key] = removeFromContent(value)
            }
          }
        })
        
        return newContent
      }

      return content
    }

    return blocks.map(block => ({
      ...block,
      content: removeFromContent(block.content)
    }))
  }, [])

  // Get summary of media usage across blocks
  const getMediaUsageSummary = useCallback((blocks: ContentBlock[]): Record<string, MediaUsage[]> => {
    const summary: Record<string, MediaUsage[]> = {}

    const collectMediaRefs = (content: any, blockId: string, blockType: string, blockTitle: string, path = '') => {
      if (!content) return

      Object.keys(content).forEach(key => {
        const value = content[key]
        const currentPath = path ? `${path}.${key}` : key

        if (value && typeof value === 'object') {
          if ('url' in value && 'assetId' in value) {
            const assetId = getMediaAssetId(value)
            if (assetId) {
              if (!summary[assetId]) {
                summary[assetId] = []
              }
              summary[assetId].push({
                blockId,
                blockType,
                fieldPath: currentPath,
                blockTitle
              })
            }
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (item && typeof item === 'object') {
                collectMediaRefs(item, blockId, blockType, blockTitle, `${currentPath}[${index}]`)
              }
            })
          } else {
            collectMediaRefs(value, blockId, blockType, blockTitle, currentPath)
          }
        }
      })
    }

    blocks.forEach(block => {
      const blockTitle = block.type.replace('-', ' ') + ' Block'
      collectMediaRefs(block.content, block.id, block.type, blockTitle)
    })

    return summary
  }, [])

  return {
    findMediaUsage,
    replaceMediaAsset,
    removeMediaAsset,
    getMediaUsageSummary
  }
}