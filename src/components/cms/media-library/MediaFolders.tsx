'use client'

import { Folder, FolderOpen, Home, Images, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaFolder } from '@/types/cms'
import { cn } from '@/lib/utils'
import { normalizeFolderPath, getParentPath } from '@/lib/media-path-utils'
import { MediaBreadcrumb } from './MediaBreadcrumb'

interface MediaFoldersProps {
  folders: MediaFolder[]
  currentFolderPath: string
  onFolderSelect: (folderPath: string) => void
  compact?: boolean
}

export function MediaFolders({
  folders,
  currentFolderPath,
  onFolderSelect,
  compact = false
}: MediaFoldersProps) {
  // Build folder tree structure
  const buildFolderTree = (folders: MediaFolder[]): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>()
    const rootFolders: FolderNode[] = []

    // Create nodes
    folders.forEach(folder => {
      folderMap.set(folder._id, {
        ...folder,
        children: [],
        level: 0
      })
    })

    // Build tree
    folders.forEach(folder => {
      const node = folderMap.get(folder._id)!
      
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId)
        if (parent) {
          parent.children.push(node)
          node.level = parent.level + 1
        }
      } else {
        rootFolders.push(node)
      }
    })

    return rootFolders.sort((a, b) => a.name.localeCompare(b.name))
  }

  const folderTree = buildFolderTree(folders)

  const renderFolder = (folder: FolderNode) => {
    const folderPath = normalizeFolderPath(folder.path)
    const isSelected = folderPath === currentFolderPath
    const hasChildren = folder.children.length > 0

    return (
      <div key={folder._id}>
        <Button
          variant={isSelected ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-auto py-2 px-2",
            `ml-${folder.level * 4}`
          )}
          onClick={() => onFolderSelect(folderPath)}
        >
          {isSelected && hasChildren ? (
            <FolderOpen className="w-4 h-4 mr-2 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
          )}
          <span className="truncate text-left">{folder.name}</span>
        </Button>
        
        {hasChildren && (
          <div className="ml-2">
            {folder.children
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(renderFolder)
            }
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Breadcrumb Navigation - only show when not at root */}
      {currentFolderPath !== '/' && (
        <MediaBreadcrumb
          currentPath={currentFolderPath}
          folders={folders}
          onNavigate={onFolderSelect}
          className="px-4 py-2 border-b border-border/40 bg-muted/10"
          maxItems={3} // Smaller limit for sidebar
        />
      )}
      
      {/* Folder tree */}
      <div className="p-4 space-y-1">
        {/* Root folder - only show when at root level */}
        {currentFolderPath === '/' && (
          <Button
            variant="secondary"
            className="w-full justify-start h-auto py-2 px-2"
            onClick={() => onFolderSelect('/')}
          >
            <Images className="w-4 h-4 mr-2" />
            All Media
          </Button>
        )}

        {/* Parent folder - only show when inside a folder */}
        {currentFolderPath !== '/' && (
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-2 px-2 mb-2 border-dashed text-muted-foreground hover:text-foreground"
            onClick={() => onFolderSelect(getParentPath(currentFolderPath))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {/* Folder list */}
        <div className="space-y-1">
          {folderTree.map(renderFolder)}
        </div>
      </div>
    </div>
  )
}

interface FolderNode extends MediaFolder {
  children: FolderNode[]
  level: number
}