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

  // Filter folders to show only direct children of current folder
  const getDisplayFolders = (): MediaFolder[] => {
    if (currentFolderPath === '/') {
      // At root: show only root-level folders
      return folders.filter(folder => !folder.parentId)
    } else {
      // Inside a folder: find current folder and show its direct children only
      const currentFolder = folders.find(f => normalizeFolderPath(f.path) === currentFolderPath)
      if (!currentFolder) return []
      
      // Return direct children only
      return folders.filter(folder => folder.parentId === currentFolder._id)
    }
  }

  const displayFolders = getDisplayFolders()

  const renderFolder = (folder: MediaFolder) => {
    const folderPath = normalizeFolderPath(folder.path)
    const isSelected = folderPath === currentFolderPath

    return (
      <Button
        key={folder._id}
        variant={isSelected ? "secondary" : "ghost"}
        className="w-full justify-start h-auto py-2 px-2"
        onClick={() => onFolderSelect(folderPath)}
      >
        <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="truncate text-left">{folder.name}</span>
      </Button>
    )
  }

  return (
    <div className="space-y-1">
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
          {displayFolders
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(renderFolder)}
        </div>
      </div>
    </div>
  )
}

