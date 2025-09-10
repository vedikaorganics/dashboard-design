'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TiptapLink from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { useCallback, useEffect, useState } from 'react'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Quote,
  Type,
  Undo,
  Redo
} from 'lucide-react'
import { Button } from './button'
import { Label } from './label'
import { cn } from '@/lib/utils'

interface TiptapRichTextEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  rows?: number
}

export function TiptapRichTextEditor({ 
  id, 
  value, 
  onChange, 
  placeholder = "Enter text...", 
  className,
  label,
  rows = 6
}: TiptapRichTextEditorProps) {
  const [forceUpdate, setForceUpdate] = useState(0)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:text-primary/80 underline cursor-pointer',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    onSelectionUpdate: () => {
      // Force re-render to update button states
      setForceUpdate(prev => prev + 1)
    },
    onTransaction: () => {
      // Force re-render on any transaction
      setForceUpdate(prev => prev + 1)
    },
    editorProps: {
      attributes: {
        class: cn(
          'p-3 min-h-[120px] focus:outline-none prose prose-sm max-w-none',
          'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground',
          'prose-blockquote:text-muted-foreground prose-blockquote:border-border',
          'prose-a:text-primary hover:prose-a:text-primary/80',
          'prose-ul:list-disc prose-ol:list-decimal prose-li:my-1'
        ),
        style: `min-height: ${rows * 1.5}rem`,
        'data-placeholder': placeholder,
      },
    },
    immediatelyRender: false,
  })

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false)
    }
  }, [editor, value])

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const formatButton = (
    command: () => void,
    icon: React.ReactNode,
    title: string,
    isActive = false
  ) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
      onClick={(e) => {
        e.preventDefault()
        command()
        // Force update after command
        setTimeout(() => setForceUpdate(prev => prev + 1), 10)
      }}
      title={title}
      disabled={!editor}
    >
      {icon}
    </Button>
  )

  if (!editor) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && <Label>{label}</Label>}
        <div className="border rounded-md p-3 min-h-[120px] bg-muted/20 animate-pulse">
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn("space-y-2", className)}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {label && <Label htmlFor={id}>{label}</Label>}
      
      <div className="border rounded-md overflow-hidden transition-colors border-input">
        {/* Toolbar */}
        <div 
          className="flex items-center flex-wrap gap-1 p-2 border-b bg-muted/30 min-w-0"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {formatButton(
            () => editor.chain().focus().undo().run(),
            <Undo className="h-4 w-4" />,
            'Undo'
          )}
          
          {formatButton(
            () => editor.chain().focus().redo().run(),
            <Redo className="h-4 w-4" />,
            'Redo'
          )}
          
          <div className="w-px h-4 bg-border mx-1" />
          
          {formatButton(
            () => editor.chain().focus().toggleBold().run(),
            <Bold className="h-4 w-4" />,
            'Bold',
            editor.isActive('bold')
          )}
          
          {formatButton(
            () => editor.chain().focus().toggleItalic().run(),
            <Italic className="h-4 w-4" />,
            'Italic',
            editor.isActive('italic')
          )}
          
          {formatButton(
            () => editor.chain().focus().toggleUnderline().run(),
            <UnderlineIcon className="h-4 w-4" />,
            'Underline',
            editor.isActive('underline')
          )}
          
          <div className="w-px h-4 bg-border mx-1" />
          
          {formatButton(
            () => editor.chain().focus().setTextAlign('left').run(),
            <AlignLeft className="h-4 w-4" />,
            'Align Left',
            editor.isActive({ textAlign: 'left' })
          )}
          
          {formatButton(
            () => editor.chain().focus().setTextAlign('center').run(),
            <AlignCenter className="h-4 w-4" />,
            'Align Center',
            editor.isActive({ textAlign: 'center' })
          )}
          
          {formatButton(
            () => editor.chain().focus().setTextAlign('right').run(),
            <AlignRight className="h-4 w-4" />,
            'Align Right',
            editor.isActive({ textAlign: 'right' })
          )}
          
          <div className="w-px h-4 bg-border mx-1" />
          
          {formatButton(
            () => editor.chain().focus().toggleBulletList().run(),
            <List className="h-4 w-4" />,
            'Bullet List',
            editor.isActive('bulletList')
          )}
          
          {formatButton(
            () => editor.chain().focus().toggleOrderedList().run(),
            <ListOrdered className="h-4 w-4" />,
            'Numbered List',
            editor.isActive('orderedList')
          )}
          
          <div className="w-px h-4 bg-border mx-1" />
          
          {formatButton(
            insertLink,
            <Link className="h-4 w-4" />,
            'Insert Link',
            editor.isActive('link')
          )}
          
          {formatButton(
            () => editor.chain().focus().toggleBlockquote().run(),
            <Quote className="h-4 w-4" />,
            'Quote',
            editor.isActive('blockquote')
          )}
          
          <div className="w-px h-4 bg-border mx-1" />
          
          {formatButton(
            () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            <Type className="h-4 w-4" />,
            'Heading',
            editor.isActive('heading', { level: 3 })
          )}
        </div>
        
        {/* Editor */}
        <EditorContent 
          editor={editor} 
          id={id}
          className="tiptap-editor"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
        
        {/* Placeholder styling */}
        <style jsx global>{`
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #9ca3af;
            pointer-events: none;
            height: 0;
          }
          .ProseMirror:focus {
            outline: none;
          }
          .tiptap-editor .ProseMirror {
            padding: 0.75rem;
            min-height: ${rows * 1.5}rem;
          }
          .tiptap-editor .ProseMirror > * + * {
            margin-top: 0.5rem;
          }
          .tiptap-editor .ProseMirror ul,
          .tiptap-editor .ProseMirror ol {
            padding: 0 1rem;
          }
          .tiptap-editor .ProseMirror h1,
          .tiptap-editor .ProseMirror h2,
          .tiptap-editor .ProseMirror h3 {
            line-height: 1.1;
            margin-top: 1rem;
            margin-bottom: 0.5rem;
          }
          .tiptap-editor .ProseMirror h3 {
            font-size: 1.125rem;
            font-weight: 600;
          }
          .tiptap-editor .ProseMirror blockquote {
            padding-left: 1rem;
            border-left: 4px solid hsl(var(--border));
            font-style: italic;
            color: hsl(var(--muted-foreground));
          }
          .tiptap-editor .ProseMirror a {
            color: hsl(var(--primary));
            text-decoration: underline;
          }
          .tiptap-editor .ProseMirror a:hover {
            color: hsl(var(--primary) / 0.8);
          }
        `}</style>
      </div>
    </div>
  )
}