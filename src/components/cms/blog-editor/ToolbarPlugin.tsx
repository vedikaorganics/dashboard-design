'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, FORMAT_TEXT_COMMAND, $createParagraphNode } from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text'
import { $createQuoteNode } from '@lexical/rich-text'
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useCallback, useEffect, useState } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Quote,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')
  
  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
    }
  }, [])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar()
      })
    })
  }, [editor, updateToolbar])

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize))
      }
    })
  }

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode())
      }
    })
  }

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode())
      }
    })
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    }
  }

  const insertUnorderedList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
  }

  const insertOrderedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
  }

  const handleBlockTypeChange = (value: string) => {
    switch (value) {
      case 'paragraph':
        formatParagraph()
        break
      case 'h1':
        formatHeading('h1')
        break
      case 'h2':
        formatHeading('h2')
        break
      case 'h3':
        formatHeading('h3')
        break
      case 'quote':
        formatQuote()
        break
    }
    setBlockType(value)
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-background">
      {/* Block Type Selector */}
      <Select value={blockType} onValueChange={handleBlockTypeChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Paragraph
            </div>
          </SelectItem>
          <SelectItem value="h1">
            <div className="flex items-center gap-2">
              <Heading1 className="w-4 h-4" />
              Heading 1
            </div>
          </SelectItem>
          <SelectItem value="h2">
            <div className="flex items-center gap-2">
              <Heading2 className="w-4 h-4" />
              Heading 2
            </div>
          </SelectItem>
          <SelectItem value="h3">
            <div className="flex items-center gap-2">
              <Heading3 className="w-4 h-4" />
              Heading 3
            </div>
          </SelectItem>
          <SelectItem value="quote">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4" />
              Quote
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('bold')}
        className={cn(isBold && "bg-accent")}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('italic')}
        className={cn(isItalic && "bg-accent")}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('underline')}
        className={cn(isUnderline && "bg-accent")}
        title="Underline"
      >
        <Underline className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText('strikethrough')}
        className={cn(isStrikethrough && "bg-accent")}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        onClick={insertUnorderedList}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={insertOrderedList}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Quote */}
      <Button
        variant="ghost"
        size="sm"
        onClick={formatQuote}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </Button>

      {/* Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={insertLink}
        title="Insert Link"
      >
        <Link className="w-4 h-4" />
      </Button>

      <div className="flex-1" />
    </div>
  )
}