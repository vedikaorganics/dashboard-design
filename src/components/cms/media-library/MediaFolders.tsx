'use client'

import { Folder, FolderOpen, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MediaFolder } from '@/types/cms'
import { cn } from '@/lib/utils'
import { normalizeFolderPath } from '@/lib/media-path-utils'

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
    <div className="p-4 space-y-1">
      <h3 className="text-sm font-medium mb-3">Folders</h3>
      
      {/* Root folder */}
      <Button
        variant={currentFolderPath === '/' ? "secondary" : "ghost"}
        className="w-full justify-start h-auto py-2 px-2"
        onClick={() => onFolderSelect('/')}
      >
        <Home className="w-4 h-4 mr-2" />
        All Media
      </Button>

      {/* Folder tree */}
      <div className="space-y-1">
        {folderTree.map(renderFolder)}
      </div>

      {folders.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No folders yet. Create your first folder to organize your media.
        </p>
      )}
    </div>
  )
}

interface FolderNode extends MediaFolder {
  children: FolderNode[]
  level: number
}