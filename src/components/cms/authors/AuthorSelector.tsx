'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Check, ChevronDown, Plus, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthors } from '@/hooks/use-data'
import { AuthorCreateDialog } from './AuthorCreateDialog'
import type { Author } from '@/types/authors'

interface AuthorSelectorProps {
  value?: string // Author slug
  onChange: (slug: string | undefined) => void
  placeholder?: string
  className?: string
}

export function AuthorSelector({
  value,
  onChange,
  placeholder = "Select author...",
  className
}: AuthorSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // Fetch authors with search
  const { data: authorsData, isLoading } = useAuthors(1, 50, search, 'active')
  const authors = (authorsData as any)?.authors || []
  
  // Find selected author
  const selectedAuthor = authors.find((author: Author) => author.slug === value)

  const handleSelect = (authorSlug: string) => {
    onChange(authorSlug === value ? undefined : authorSlug)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(undefined)
  }

  const handleCreateAuthor = (newAuthor: Author) => {
    onChange(newAuthor.slug)
    setShowCreateDialog(false)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Author</Label>
      
      {/* Selected Author Display */}
      {selectedAuthor && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/20">
          <Avatar className="h-6 w-6">
            {selectedAuthor.avatar && (
              <AvatarImage src={selectedAuthor.avatar} alt={selectedAuthor.displayName} />
            )}
            <AvatarFallback className="text-xs">
              {selectedAuthor.displayName.split(' ').map((n: string) => n[0] || '').join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{selectedAuthor.displayName}</div>
            {selectedAuthor.role && (
              <Badge variant="secondary" className="text-xs">
                {selectedAuthor.role}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Author Selector */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedAuthor ? (
              <span className="flex items-center gap-2">
                <Avatar className="h-4 w-4">
                  {selectedAuthor.avatar && (
                    <AvatarImage src={selectedAuthor.avatar} alt={selectedAuthor.displayName} />
                  )}
                  <AvatarFallback className="text-xs">
                    {selectedAuthor.displayName.split(' ').map((n: string) => n[0] || '').join('')}
                  </AvatarFallback>
                </Avatar>
                {selectedAuthor.displayName}
              </span>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                {placeholder}
              </>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search authors..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? (
                  "Loading authors..."
                ) : (
                  <div className="py-6 text-center text-sm">
                    <div className="mb-2">No authors found</div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Author
                    </Button>
                  </div>
                )}
              </CommandEmpty>
              
              <CommandGroup>
                {authors.map((author: Author) => (
                  <CommandItem
                    key={author.slug}
                    value={author.slug}
                    onSelect={() => handleSelect(author.slug)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === author.slug ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Avatar className="h-6 w-6">
                      {author.avatar && (
                        <AvatarImage src={author.avatar} alt={author.displayName} />
                      )}
                      <AvatarFallback className="text-xs">
                        {author.displayName.split(' ').map((n: string) => n[0] || '').join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{author.displayName}</div>
                      {author.role && (
                        <div className="text-xs text-muted-foreground">{author.role}</div>
                      )}
                    </div>
                    {author.featured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              
              {/* Create New Author Option */}
              {!isLoading && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => setShowCreateDialog(true)}
                    className="flex items-center gap-2 text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Author</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Author Dialog */}
      <AuthorCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onAuthorCreated={handleCreateAuthor}
      />
    </div>
  )
}