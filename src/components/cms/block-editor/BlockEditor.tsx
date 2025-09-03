'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Eye, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ContentBlock } from '@/types/cms'
import { createBlock, reorderBlocks } from '@/lib/cms/blocks'
import { BlockList } from './BlockList'
import { SortableBlockItem } from './SortableBlockItem'
import { BlockSettings } from './BlockSettings'

interface BlockEditorProps {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
  onPreview?: () => void
  className?: string
}

export function BlockEditor({
  blocks,
  onChange,
  onPreview,
  className
}: BlockEditorProps) {
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null)
  const [showBlockList, setShowBlockList] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const activeIndex = blocks.findIndex(block => block.id === active.id)
      const overIndex = blocks.findIndex(block => block.id === over.id)

      if (activeIndex !== -1 && overIndex !== -1) {
        const reorderedBlocks = reorderBlocks(blocks, activeIndex, overIndex)
        onChange(reorderedBlocks)
      }
    }
  }, [blocks, onChange])

  // Add new block
  const handleAddBlock = useCallback((blockType: ContentBlock['type']) => {
    const newBlock = createBlock(blockType)
    const updatedBlocks = [...blocks, newBlock]
    onChange(updatedBlocks)
    setSelectedBlock(newBlock)
    setShowBlockList(false)
  }, [blocks, onChange])

  // Update block content
  const handleUpdateBlock = useCallback((blockId: string, updates: Partial<ContentBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    )
    onChange(updatedBlocks)

    // Update selected block if it's the one being edited
    if (selectedBlock?.id === blockId) {
      setSelectedBlock({ ...selectedBlock, ...updates })
    }
  }, [blocks, selectedBlock, onChange])

  // Duplicate block
  const handleDuplicateBlock = useCallback((blockId: string) => {
    const blockToDuplicate = blocks.find(block => block.id === blockId)
    if (!blockToDuplicate) return

    const newBlock = createBlock(
      blockToDuplicate.type,
      blockToDuplicate.content
    )
    
    const blockIndex = blocks.findIndex(block => block.id === blockId)
    const updatedBlocks = [
      ...blocks.slice(0, blockIndex + 1),
      newBlock,
      ...blocks.slice(blockIndex + 1)
    ]
    
    onChange(updatedBlocks)
  }, [blocks, onChange])

  // Delete block
  const handleDeleteBlock = useCallback((blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId)
    onChange(updatedBlocks)

    // Clear selection if deleted block was selected
    if (selectedBlock?.id === blockId) {
      setSelectedBlock(null)
    }
  }, [blocks, selectedBlock, onChange])

  // Select block
  const handleSelectBlock = useCallback((block: ContentBlock | null) => {
    setSelectedBlock(block)
    if (block) {
      setShowSettings(true)
    }
  }, [])

  return (
    <>
      <div className={`flex h-full ${className || ''}`}>
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowBlockList(true)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Block
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          {blocks.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start building your content</h3>
                <p className="text-muted-foreground mb-4">
                  Add blocks to create engaging pages with text, images, videos, and more.
                </p>
                <Button onClick={() => setShowBlockList(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Block
                </Button>
              </div>
            </div>
          ) : (
            // Block list
            <div className="pt-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map(block => block.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {blocks.map((block) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        isSelected={selectedBlock?.id === block.id}
                        onSelect={() => handleSelectBlock(block)}
                        onUpdate={handleUpdateBlock}
                        onDuplicate={handleDuplicateBlock}
                        onDelete={handleDeleteBlock}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Add Block Dialog */}
      <Dialog open={showBlockList} onOpenChange={setShowBlockList}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Content Block</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            <BlockList
              onBlockSelect={(blockType) => {
                handleAddBlock(blockType)
                setShowBlockList(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Settings Dialog */}
      <Dialog open={showSettings && !!selectedBlock} onOpenChange={(open) => {
        setShowSettings(open)
        if (!open) setSelectedBlock(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Edit {selectedBlock?.type.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')} Block
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            {selectedBlock && (
              <BlockSettings
                block={selectedBlock}
                onUpdate={(updates) => handleUpdateBlock(selectedBlock.id, updates)}
                onClose={() => {
                  setShowSettings(false)
                  setSelectedBlock(null)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}