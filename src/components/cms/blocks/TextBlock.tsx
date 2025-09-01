'use client'

import { TextBlockContent } from '@/types/cms'
import { cn } from '@/lib/utils'

interface TextBlockProps {
  content: TextBlockContent
  isEditing?: boolean
  className?: string
}

export function TextBlock({ content, isEditing = false, className }: TextBlockProps) {
  const {
    text,
    columns = 1,
    alignment = 'left'
  } = content

  const getColumnClass = () => {
    switch (columns) {
      case 2:
        return 'columns-2'
      case 3:
        return 'columns-3'
      default:
        return ''
    }
  }

  const getAlignmentClass = () => {
    switch (alignment) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      case 'justify':
        return 'text-justify'
      default:
        return 'text-left'
    }
  }

  // If editing and no text, show placeholder
  if (isEditing && !text) {
    return (
      <div className={cn('prose prose-gray max-w-none', getAlignmentClass(), className)}>
        <div className="text-muted-foreground bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-lg mb-2">Text Block</p>
          <p className="text-sm">Click to edit and add your content here. You can use HTML formatting, create columns, and adjust text alignment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'prose prose-gray max-w-none',
      getColumnClass(),
      getAlignmentClass(),
      // Custom prose styles for better CMS integration
      'prose-headings:font-bold prose-headings:tracking-tight',
      'prose-h1:text-4xl prose-h1:mb-4',
      'prose-h2:text-3xl prose-h2:mb-3',
      'prose-h3:text-2xl prose-h3:mb-3',
      'prose-h4:text-xl prose-h4:mb-2',
      'prose-h5:text-lg prose-h5:mb-2',
      'prose-h6:text-base prose-h6:mb-2',
      'prose-p:text-base prose-p:leading-relaxed prose-p:mb-4',
      'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
      'prose-strong:font-semibold prose-em:italic',
      'prose-ul:list-disc prose-ol:list-decimal',
      'prose-li:mb-1',
      'prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic',
      'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
      'prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto',
      // Responsive adjustments
      'sm:prose-lg lg:prose-xl',
      className
    )}>
      <div 
        dangerouslySetInnerHTML={{ __html: text || '' }}
        className={cn(
          columns > 1 && 'gap-6 sm:gap-8',
          // Column break handling
          '[&>*]:break-inside-avoid [&>h1]:column-span-all [&>h2]:column-span-all'
        )}
      />
    </div>
  )
}

// Rich text editor component for editing mode
export function TextBlockEditor({ 
  content, 
  onChange, 
  className 
}: { 
  content: TextBlockContent
  onChange: (content: Partial<TextBlockContent>) => void
  className?: string 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Simple textarea for now - in production you'd use a rich text editor */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <textarea
          value={content.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Enter your text content here. HTML tags are supported."
          className="w-full min-h-48 p-3 border rounded-md resize-y font-mono text-sm"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
        />
        <div className="text-xs text-muted-foreground">
          <p>Supported HTML tags: h1-h6, p, strong, em, a, ul, ol, li, blockquote, code, pre, br</p>
          <p>Example: &lt;h2&gt;Heading&lt;/h2&gt;&lt;p&gt;This is &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;</p>
        </div>
      </div>

      {/* Column settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Columns</label>
          <select
            value={content.columns || 1}
            onChange={(e) => onChange({ columns: parseInt(e.target.value) as 1 | 2 | 3 })}
            className="w-full p-2 border rounded-md"
          >
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Alignment</label>
          <select
            value={content.alignment || 'left'}
            onChange={(e) => onChange({ alignment: e.target.value as 'left' | 'center' | 'right' | 'justify' })}
            className="w-full p-2 border rounded-md"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Preview</label>
        <div className="border rounded-md p-4 bg-background">
          <TextBlock content={content} isEditing={false} />
        </div>
      </div>
    </div>
  )
}