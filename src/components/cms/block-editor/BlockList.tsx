'use client'

import { 
  Type,
  Image as ImageIcon,
  Video,
  Layout,
  ShoppingCart,
  MousePointer,
  Star,
  HelpCircle,
  Megaphone,
  Grid,
  Minus,
  Monitor
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ContentBlock } from '@/types/cms'
import { BlockCategory } from '@/lib/cms/blocks'
import { cn } from '@/lib/utils'

interface BlockListProps {
  onBlockSelect: (type: ContentBlock['type']) => void
}

interface BlockDefinition {
  type: ContentBlock['type']
  name: string
  description: string
  icon: React.ReactNode
  category: BlockCategory
  popular?: boolean
}

const blockDefinitions: BlockDefinition[] = [
  // Content blocks
  {
    type: 'hero-section',
    name: 'Hero Section',
    description: 'Large hero section with image/video background, heading, text, and CTA button',
    icon: <Monitor className="w-5 h-5" />,
    category: 'content',
    popular: true
  },
  {
    type: 'video-cta',
    name: 'Video CTA Section',
    description: 'Video background with heading, text, and call-to-action button',
    icon: <Video className="w-5 h-5" />,
    category: 'content',
    popular: true
  },
  {
    type: 'sliding-images-cta',
    name: 'Sliding Images CTA',
    description: 'Carousel of images with heading, text, and CTA buttons',
    icon: <Grid className="w-5 h-5" />,
    category: 'content',
    popular: true
  },
  {
    type: 'text',
    name: 'Text Block',
    description: 'Rich text editor with formatting options and column layouts',
    icon: <Type className="w-5 h-5" />,
    category: 'content',
    popular: true
  },
  
  // Media blocks
  {
    type: 'image',
    name: 'Image',
    description: 'Single image with caption and optional link',
    icon: <ImageIcon className="w-5 h-5" />,
    category: 'media',
    popular: true
  },
  {
    type: 'gallery',
    name: 'Image Gallery',
    description: 'Grid or carousel of multiple images with lightbox',
    icon: <Grid className="w-5 h-5" />,
    category: 'media'
  },
  {
    type: 'video',
    name: 'Video',
    description: 'Embedded or uploaded video with custom controls',
    icon: <Video className="w-5 h-5" />,
    category: 'media'
  },


  // E-commerce blocks
  {
    type: 'product-grid',
    name: 'Product Grid',
    description: 'Display products in grid or carousel format',
    icon: <ShoppingCart className="w-5 h-5" />,
    category: 'ecommerce',
    popular: true
  },

  // Interactive blocks
  {
    type: 'faq',
    name: 'FAQ',
    description: 'Expandable frequently asked questions section',
    icon: <HelpCircle className="w-5 h-5" />,
    category: 'interactive'
  },
  {
    type: 'custom-html',
    name: 'Custom HTML',
    description: 'Add custom HTML, CSS and JavaScript code',
    icon: <Layout className="w-5 h-5" />,
    category: 'layout'
  }
]

export function BlockList({ onBlockSelect }: BlockListProps) {
  // Show all blocks without filtering
  const filteredBlocks = blockDefinitions


  return (
    <div className="flex flex-col h-full">
      {/* Block grid */}
      <div className="flex-1 overflow-auto">
        {filteredBlocks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No blocks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {filteredBlocks.map((block) => (
              <button
                key={block.type}
                onClick={() => onBlockSelect(block.type)}
                className="p-4 text-center rounded-lg border hover:bg-muted/50 transition-colors group h-full"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-muted-foreground group-hover:text-foreground mb-1">
                    {block.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center space-x-1">
                      <h4 className="font-medium text-sm text-center">{block.name}</h4>
                      {block.popular && (
                        <Badge variant="secondary" className="text-xs">
                          ★
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
                      {block.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Tip: Use drag handles to reorder blocks after adding them.
        </p>
      </div>
    </div>
  )
}