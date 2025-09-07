'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface SimpleRichTextEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  rows?: number
}

export function SimpleRichTextEditor({ 
  id, 
  value, 
  onChange, 
  placeholder = "Enter text...", 
  className,
  label,
  rows = 6
}: SimpleRichTextEditorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-[120px] resize-y"
      />
      <div className="text-xs text-muted-foreground">
        Simple text editor (supports basic HTML)
      </div>
    </div>
  )
}