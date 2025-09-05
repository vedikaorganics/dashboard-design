import { MediaFolder } from '@/types/cms'

/**
 * Utility functions for handling media library path-based navigation
 * Supports both query parameter URLs (legacy) and path-based URLs (new)
 */

/**
 * Encodes a folder path for safe URL usage
 * @param path - The folder path (e.g., "folder1/subfolder/deep folder")
 * @returns Encoded path (e.g., "folder1/subfolder/deep%20folder")
 */
export function encodeFolderPath(path: string): string {
  if (!path || path === '/') return ''
  
  // Remove leading/trailing slashes and split into segments
  const segments = path.replace(/^\/+|\/+$/g, '').split('/')
  
  // Encode each segment and rejoin
  return segments.map(segment => encodeURIComponent(segment)).join('/')
}

/**
 * Decodes a URL-encoded folder path
 * @param encodedPath - The encoded path from URL
 * @returns Decoded path
 */
export function decodeFolderPath(encodedPath: string): string {
  if (!encodedPath) return '/'
  
  // Split into segments and decode each one
  const segments = encodedPath.split('/').map(segment => decodeURIComponent(segment))
  
  // Return with leading slash
  return '/' + segments.join('/')
}

/**
 * Normalizes a folder path by ensuring it starts with / and has no trailing slash
 * @param path - The raw path
 * @returns Normalized path
 */
export function normalizeFolderPath(path: string | null): string {
  if (!path || path === 'root' || path === '') return '/'
  
  // Ensure starts with /
  const normalized = path.startsWith('/') ? path : '/' + path
  
  // Remove trailing slash unless it's root
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '')
}

/**
 * Resolves a folder path to its corresponding folder ID
 * @param path - The folder path (e.g., "/folder1/subfolder")
 * @param folders - Array of all folders
 * @returns The folder ID or null if path is root or not found
 */
export function resolvePathToFolderId(path: string | null, folders: MediaFolder[]): string | null {
  const normalizedPath = normalizeFolderPath(path)
  
  // Root path
  if (normalizedPath === '/') {
    return null
  }
  
  // Try to find folder with exact normalized path match first
  let folder = folders.find(f => normalizeFolderPath(f.path) === normalizedPath)
  
  // If not found, try backward compatibility matches
  if (!folder) {
    // Try without leading slash (for legacy paths like "coconut")
    const pathWithoutSlash = normalizedPath.substring(1)
    folder = folders.find(f => f.path === pathWithoutSlash)
    
    // If still not found, try adding leading slash to stored paths
    if (!folder) {
      folder = folders.find(f => `/${f.path}` === normalizedPath)
    }
  }
  
  return folder?._id || null
}

/**
 * Resolves a folder ID to its corresponding path
 * @param folderId - The folder ID
 * @param folders - Array of all folders
 * @returns The folder path or '/' if ID is null or not found
 */
export function resolveFolderIdToPath(folderId: string | null, folders: MediaFolder[]): string {
  if (!folderId) return '/'
  
  const folder = folders.find(f => f._id === folderId)
  return folder ? normalizeFolderPath(folder.path) : '/'
}

/**
 * Validates if a folder path format is valid
 * @param path - The path to validate
 * @returns True if valid, false otherwise
 */
export function isValidFolderPath(path: string): boolean {
  if (!path) return false
  
  // Root is always valid
  if (path === '/') return true
  
  // Must start with /
  if (!path.startsWith('/')) return false
  
  // Split into segments and validate each
  const segments = path.slice(1).split('/')
  
  for (const segment of segments) {
    // Empty segments not allowed (double slashes)
    if (!segment) return false
    
    // Check for invalid characters (adjust as needed)
    if (segment.includes('..') || segment.includes('\0')) return false
  }
  
  return true
}

/**
 * Extracts the parent path from a folder path
 * @param path - The folder path
 * @returns The parent path or '/' if already at root
 */
export function getParentPath(path: string): string {
  const normalized = normalizeFolderPath(path)
  
  if (normalized === '/') return '/'
  
  const lastSlashIndex = normalized.lastIndexOf('/')
  if (lastSlashIndex <= 0) return '/'
  
  return normalized.substring(0, lastSlashIndex)
}

/**
 * Gets the folder name from a path
 * @param path - The folder path
 * @returns The folder name or 'All Media' for root
 */
export function getFolderNameFromPath(path: string): string {
  const normalized = normalizeFolderPath(path)
  
  if (normalized === '/') return 'All Media'
  
  const segments = normalized.split('/')
  return segments[segments.length - 1] || 'All Media'
}

/**
 * Builds a full path from a parent path and folder name
 * @param parentPath - The parent folder path
 * @param folderName - The new folder name
 * @returns The combined path
 */
export function buildFolderPath(parentPath: string, folderName: string): string {
  const normalizedParent = normalizeFolderPath(parentPath)
  
  if (normalizedParent === '/') {
    return '/' + folderName
  }
  
  return normalizedParent + '/' + folderName
}

/**
 * Checks if the current user is viewing a valid folder path
 * This is primarily for backward compatibility with folder ID URLs
 * @param searchParams - URLSearchParams from the current page
 * @returns Object with path info and whether URL needs updating
 */
export function analyzeFolderUrl(searchParams: URLSearchParams): {
  currentPath: string | null
  currentFolderId: string | null
  needsUrlUpdate: boolean
  isLegacyUrl: boolean
} {
  const pathParam = searchParams.get('path')
  const folderIdParam = searchParams.get('folderId')
  
  // Path-based URL (preferred)
  if (pathParam) {
    const decoded = decodeFolderPath(pathParam)
    return {
      currentPath: decoded,
      currentFolderId: null,
      needsUrlUpdate: false,
      isLegacyUrl: false
    }
  }
  
  // Legacy folder ID URL
  if (folderIdParam) {
    return {
      currentPath: null,
      currentFolderId: folderIdParam,
      needsUrlUpdate: true, // Should migrate to path-based URL
      isLegacyUrl: true
    }
  }
  
  // No folder specified (root)
  return {
    currentPath: '/',
    currentFolderId: null,
    needsUrlUpdate: false,
    isLegacyUrl: false
  }
}

/**
 * NEW FUNCTIONS FOR PATH-BASED URL ROUTING
 */

/**
 * Converts URL path segments to folder path
 * @param segments - Array of URL segments (e.g., ['folder1', 'subfolder'])
 * @returns Folder path (e.g., '/folder1/subfolder')
 */
export function pathSegmentsToFolderPath(segments: string[] | undefined): string {
  if (!segments || segments.length === 0) {
    return '/'
  }
  
  // Decode each segment and join
  const decodedSegments = segments.map(segment => decodeURIComponent(segment))
  return '/' + decodedSegments.join('/')
}

/**
 * Converts folder path to URL segments
 * @param path - Folder path (e.g., '/folder1/subfolder')
 * @returns Array of encoded segments (e.g., ['folder1', 'subfolder'])
 */
export function folderPathToSegments(path: string): string[] {
  if (!path || path === '/') {
    return []
  }
  
  // Remove leading slash and split
  const segments = path.replace(/^\/+/, '').split('/')
  // Encode each segment for URL safety
  return segments.map(segment => encodeURIComponent(segment))
}

/**
 * Builds media URL for path-based routing
 * @param folderPath - Folder path (e.g., '/folder1/subfolder')
 * @returns URL path (e.g., '/cms/media/folder1/subfolder')
 */
export function buildMediaUrl(folderPath: string): string {
  if (!folderPath || folderPath === '/') {
    return '/cms/media'
  }
  
  const segments = folderPathToSegments(folderPath)
  return `/cms/media/${segments.join('/')}`
}

/**
 * Extracts folder path from dynamic route params
 * @param params - Next.js route params with path array
 * @returns Normalized folder path
 */
export function extractFolderPathFromParams(params: { path?: string[] }): string {
  const segments = params.path
  const folderPath = pathSegmentsToFolderPath(segments)
  return normalizeFolderPath(folderPath)
}