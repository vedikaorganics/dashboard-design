'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { $getRoot, $getSelection } from 'lexical'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TRANSFORMERS } from '@lexical/markdown'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListItemNode, ListNode } from '@lexical/list'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { CodeHighlightNode, CodeNode } from '@lexical/code'

import { cn } from '@/lib/utils'
import { CMSContent, ContentBlock } from '@/types/cms'
import { ToolbarPlugin } from './ToolbarPlugin'
import { BlogSidebar } from './BlogSidebar'
import { AutoSavePlugin } from './AutoSavePlugin'
import { useWordCount } from './hooks/useWordCount'

// Editor theme
const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'mb-1',
  quote: 'border-l-4 border-primary pl-4 italic text-muted-foreground my-4',
  heading: {
    h1: 'text-3xl font-bold mt-6 mb-4',
    h2: 'text-2xl font-bold mt-5 mb-3',
    h3: 'text-xl font-bold mt-4 mb-2',
    h4: 'text-lg font-bold mt-3 mb-2',
    h5: 'text-base font-bold mt-2 mb-1',
    h6: 'text-sm font-bold mt-2 mb-1',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal ml-6 my-2',
    ul: 'list-disc ml-6 my-2',
    listitem: 'my-1',
  },
  link: 'text-primary hover:text-primary/80 underline cursor-pointer',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-muted px-1 py-0.5 rounded font-mono text-sm',
  },
  horizontalRule: 'border-t border-border my-4',
  code: 'bg-muted p-4 rounded font-mono text-sm my-4',
}

// Plugin to set initial content
function InitialContentPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    if (content) {
      editor.update(() => {
        const parser = new DOMParser()
        const dom = parser.parseFromString(content, 'text/html')
        const nodes = $generateNodesFromDOM(editor, dom)
        $getRoot().clear()
        $getRoot().append(...nodes)
      })
    }
  }, [editor, content])

  return null
}

interface BlogEditorProps {
  content: CMSContent
  onUpdate: (updates: Partial<CMSContent>) => void
  onSave: () => Promise<void>
  onPublish?: (publishAt?: Date) => Promise<void>
  onUnpublish?: () => Promise<void>
  isLoading?: boolean
}

export function BlogEditor({
  content,
  onUpdate,
  onSave,
  onPublish,
  onUnpublish,
  isLoading = false
}: BlogEditorProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const editorRef = useRef<any>(null)

  // Initialize content - convert from blocks to HTML if needed  
  const initialContent = content.blocks?.[0]?.type === 'text' 
    ? (content.blocks[0].content as any).text 
    : '<p>Start writing your blog post...</p>'

  const initialConfig = {
    namespace: 'blog-editor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      LinkNode,
      AutoLinkNode,
      HorizontalRuleNode,
      CodeNode,
      CodeHighlightNode,
    ],
  }

  const handleContentChange = useCallback((html: string) => {
    // Update content blocks with the new HTML
    const updatedBlocks: ContentBlock[] = [{
      id: content.blocks?.[0]?.id || 'text-1',
      type: 'text',
      order: 0,
      content: {
        text: html,
        alignment: 'left'
      }
    }]
    
    onUpdate({ blocks: updatedBlocks })
  }, [content.blocks, onUpdate])

  const handleAutoSave = useCallback(async (html: string) => {
    setIsSaving(true)
    try {
      // First update the content
      handleContentChange(html)
      
      // Then save
      await onSave()
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [handleContentChange, onSave])

  const handlePublish = useCallback(async (publishAt?: Date) => {
    if (onPublish) {
      await onPublish(publishAt)
    }
  }, [onPublish])

  const handleUnpublish = useCallback(async () => {
    if (onUnpublish) {
      await onUnpublish()
    }
  }, [onUnpublish])

  // Word count using the existing hook
  const [wordCount, setWordCount] = useState(0)
  const [readingTime, setReadingTime] = useState(1)

  const handleChange = (editorState: any) => {
    editorState.read(() => {
      const text = $getRoot().getTextContent()
      const words = text.trim().split(/\s+/).filter(Boolean).length
      setWordCount(words)
      setReadingTime(Math.max(1, Math.ceil(words / 200)))
    })
  }

  return (
    <div className="flex h-[calc(100vh-300px)]">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        <LexicalComposer initialConfig={initialConfig}>
          {/* Toolbar */}
          <ToolbarPlugin />
          
          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable
                    className={cn(
                      'min-h-[500px] p-6 focus:outline-none',
                      'prose prose-gray dark:prose-invert max-w-none',
                      'prose-headings:font-bold prose-headings:tracking-tight',
                      'prose-p:leading-7 prose-blockquote:border-primary',
                      'prose-a:text-primary prose-a:no-underline hover:prose-a:underline'
                    )}
                    aria-placeholder="Start writing your blog post..."
                    placeholder={
                      <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none">
                        Start writing your blog post...
                      </div>
                    }
                  />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <OnChangePlugin onChange={handleChange} />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <InitialContentPlugin content={initialContent} />
              <AutoSavePlugin 
                onSave={handleAutoSave}
                hasUnsavedChanges={hasUnsavedChanges}
                onUnsavedChanges={setHasUnsavedChanges}
                initialContent={initialContent}
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/10 text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>{wordCount} words</span>
              <span>{readingTime} min read</span>
              {isSaving && <span>Saving...</span>}
              {lastSaved && !isSaving && (
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {content.publishedAt && (
                <span>Published: {new Date(content.publishedAt).toLocaleString()}</span>
              )}
              {content.scheduledPublishAt && (
                <span>Scheduled: {new Date(content.scheduledPublishAt).toLocaleString()}</span>
              )}
              <span>Type: Blog Post</span>
            </div>
          </div>
        </LexicalComposer>
      </div>

      {/* Sidebar */}
      <BlogSidebar
        content={content}
        onUpdate={onUpdate}
      />
    </div>
  )
}