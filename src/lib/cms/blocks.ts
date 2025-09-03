import { BlockDefinition, ContentBlock, BlockContent } from '@/types/cms'

// Block type registry - will be populated with actual components later
export const blockRegistry: Record<string, BlockDefinition> = {}

// Default content for each block type
export function getDefaultBlockContent(type: ContentBlock['type']): BlockContent {
  switch (type) {
    case 'video-cta':
      return {
        video: {
          desktop: '',
          mobile: ''
        },
        heading: 'Your Heading Here',
        text: 'Add your description text here.',
        cta: { text: 'Learn More', link: '' },
        overlay: false,
        overlayOpacity: 0.5,
        height: 'medium'
      } as any
    
    case 'sliding-images-cta':
      return {
        slides: [{
          image: {
            desktop: '',
            mobile: ''
          },
          heading: 'Slide Heading',
          text: 'Slide description text.',
          cta: { text: 'Learn More', link: '' }
        }],
        autoplay: false,
        autoplaySpeed: 3000,
        showDots: true,
        showArrows: true
      } as any
    
    case 'text':
      return {
        text: 'Enter your text content here...',
        columns: 1,
        alignment: 'left'
      } as any
    
    case 'image':
      return {
        src: {
          desktop: '',
          mobile: ''
        },
        alt: '',
        caption: '',
        link: '',
        objectFit: 'cover',
        width: '',
        height: ''
      } as any
    
    case 'gallery':
      return {
        images: [],
        layout: 'grid',
        columns: 3,
        showCaptions: true,
        lightbox: true
      } as any
    
    case 'video':
      return {
        type: 'upload',
        src: {
          desktop: '',
          mobile: ''
        },
        poster: {
          desktop: '',
          mobile: ''
        },
        controls: true,
        autoplay: false,
        loop: false,
        muted: false
      } as any
    
    case 'product-grid':
      return {
        products: [],
        layout: 'grid',
        columns: 3,
        showPrice: true,
        showRating: true,
        showAddToCart: true,
        filters: {}
      } as any
    
    case 'testimonials':
      return {
        testimonials: [],
        layout: 'grid',
        showRating: true,
        showAvatar: true
      } as any
    
    case 'faq':
      return {
        faqs: [],
        allowMultipleOpen: false
      } as any
    
    case 'cta':
      return {
        heading: 'Ready to Get Started?',
        description: 'Join thousands of satisfied customers.',
        buttons: [{
          text: 'Get Started',
          url: '',
          style: 'primary'
        }],
        backgroundImage: {
          desktop: '',
          mobile: ''
        },
        backgroundColor: ''
      } as any
    
    case 'banner':
      return {
        text: 'Important announcement or message here.',
        type: 'info',
        dismissible: true,
        icon: '',
        buttons: []
      } as any
    
    case 'accordion':
      return {
        items: [],
        allowMultipleOpen: false
      } as any
    
    case 'tabs':
      return {
        tabs: [],
        defaultTab: 0,
        orientation: 'horizontal'
      } as any
    
    case 'spacer':
      return {
        height: {
          desktop: 50,
          tablet: 40,
          mobile: 30
        }
      } as any
    
    case 'custom-html':
      return {
        html: '<div>Your custom HTML here</div>',
        css: '',
        js: ''
      } as any
    
    case 'columns':
      return {
        columns: [
          { width: 50, blocks: [] },
          { width: 50, blocks: [] }
        ],
        gap: 16
      } as any
    
    default:
      return {} as any
  }
}

// Helper function to create a new block
export function createBlock(
  type: ContentBlock['type'],
  content?: Partial<BlockContent>
): ContentBlock {
  return {
    id: generateBlockId(),
    type,
    order: 0,
    content: { ...getDefaultBlockContent(type), ...content } as BlockContent,
    responsive: {
      desktop: { visible: true },
      tablet: { visible: true },
      mobile: { visible: true }
    },
    visibility: {
      showOn: 'all'
    }
  }
}

// Generate unique block ID
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper to get block definition
export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return blockRegistry[type]
}

// Helper to validate block content
export function validateBlockContent(type: string, content: BlockContent): boolean {
  // Basic validation - in a real app, you'd have more sophisticated validation
  try {
    // Check if required fields exist based on block type
    switch (type) {
      case 'video-cta':
        const videoCTAContent = content as any
        return Boolean(
          (videoCTAContent.video?.desktop || videoCTAContent.video) && 
          videoCTAContent.heading
        )
      case 'sliding-images-cta':
        return Array.isArray((content as any).slides) && (content as any).slides.length > 0
      case 'text':
        return Boolean((content as any).text)
      case 'image':
        const imageContent = content as any
        return Boolean(
          (imageContent.src?.desktop || imageContent.src) && 
          imageContent.alt
        )
      case 'gallery':
        const galleryContent = content as any
        return Array.isArray(galleryContent.images) && 
               galleryContent.images.length > 0 &&
               galleryContent.images.every((img: any) => 
                 (img.src?.desktop || img.src) && img.alt
               )
      case 'video':
        const videoContent = content as any
        return Boolean(
          videoContent.src?.desktop || videoContent.src
        )
      case 'product-grid':
        return true // No required fields for product grid
      case 'testimonials':
        return Array.isArray((content as any).testimonials) && (content as any).testimonials.length > 0
      case 'faq':
        return Array.isArray((content as any).faqs) && (content as any).faqs.length > 0
      case 'cta':
        return Boolean((content as any).heading)
      case 'banner':
        return Boolean((content as any).text)
      case 'accordion':
        return Array.isArray((content as any).items) && (content as any).items.length > 0
      case 'tabs':
        return Array.isArray((content as any).tabs) && (content as any).tabs.length > 0
      case 'spacer':
        return Boolean((content as any).height?.desktop)
      case 'custom-html':
        return Boolean((content as any).html)
      case 'columns':
        return Boolean((content as any).gap !== undefined)
      default:
        return true
    }
  } catch {
    return false
  }
}

// Helper to duplicate a block
export function duplicateBlock(block: ContentBlock): ContentBlock {
  return {
    ...block,
    id: generateBlockId(),
    order: block.order + 1
  }
}

// Helper to reorder blocks
export function reorderBlocks(blocks: ContentBlock[], fromIndex: number, toIndex: number): ContentBlock[] {
  const reorderedBlocks = [...blocks]
  const [removed] = reorderedBlocks.splice(fromIndex, 1)
  reorderedBlocks.splice(toIndex, 0, removed)
  
  // Update order property
  return reorderedBlocks.map((block, index) => ({
    ...block,
    order: index
  }))
}

// Helper to get blocks by category
export function getBlocksByCategory(category: string): BlockDefinition[] {
  return Object.values(blockRegistry).filter(block => block.category === category)
}

// Helper to search blocks
export function searchBlocks(query: string): BlockDefinition[] {
  const lowercaseQuery = query.toLowerCase()
  return Object.values(blockRegistry).filter(block =>
    block.name.toLowerCase().includes(lowercaseQuery) ||
    block.description.toLowerCase().includes(lowercaseQuery)
  )
}

// Block categories for organization
export const blockCategories = {
  content: {
    name: 'Content',
    icon: 'Type',
    description: 'Text, headings, and rich content blocks'
  },
  media: {
    name: 'Media',
    icon: 'Image',
    description: 'Images, videos, and galleries'
  },
  layout: {
    name: 'Layout',
    icon: 'Layout',
    description: 'Columns, spacers, and structural elements'
  },
  ecommerce: {
    name: 'E-commerce',
    icon: 'ShoppingCart',
    description: 'Product grids, pricing, and shopping features'
  },
  interactive: {
    name: 'Interactive',
    icon: 'MousePointer',
    description: 'Forms, buttons, and interactive components'
  }
} as const

export type BlockCategory = keyof typeof blockCategories