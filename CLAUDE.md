# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start Development Server:**
```bash
npm run dev
# Runs on port 3000 with Turbopack enabled
```

**Build & Production:**
```bash
npm run build    # Build with Turbopack
npm start        # Start production server
```

**Linting:**
```bash
npm run lint     # ESLint with Next.js config
```

**Add shadcn/ui Components:**
```bash
npx shadcn@latest add [component-name]
```

## Architecture Overview

### Design System Structure
This project implements a centralized design system architecture:

- **Design Tokens** (`src/design-system/tokens/`): Centralized color, spacing, and typography definitions that serve as the single source of truth
- **Themes** (`src/design-system/themes/`): Light/dark theme configurations that reference design tokens
- **Primitives** (`src/design-system/primitives/`): Base component variant definitions

The design system enables easy UI overhauls by modifying tokens rather than individual components.

### Layout Architecture
- **DashboardLayout** (`src/components/layout/dashboard-layout.tsx`): Main layout wrapper using sidebar + header pattern
- **AppSidebar**: Collapsible navigation with grouped menu items
- **Header**: Top navigation with search, theme toggle, and user menu
- All dashboard pages wrap content with `<DashboardLayout>`

### Chart Components
Custom chart components (`src/components/charts/`) built on Recharts:
- Each chart type (Area, Bar, Line, Pie) has consistent APIs
- Charts can be rendered standalone or within cards with titles/descriptions
- All charts are responsive and support theming

### Data Management Patterns
- Pages use mock data arrays at the top of components
- Table data follows consistent structures with `id`, `name`, `status` patterns
- Status badges use variant mapping objects for consistent styling
- Actions use shadcn/ui DropdownMenu components

### Page Structure Pattern
Each management page follows this structure:
1. Mock data definitions at component top
2. Helper functions for badges/status rendering
3. Main component with DashboardLayout wrapper
4. KPI cards grid using responsive classes
5. Main content card with search/filter controls
6. Responsive data table with overflow handling

### Key Technical Decisions

**Styling:** Uses Tailwind CSS v4 with CSS-in-JS approach and CSS variables for theming
**Components:** Built on shadcn/ui (Radix UI primitives) with custom theming
**State Management:** Currently uses React state; no global state management
**Responsive Strategy:** Mobile-first with responsive grid classes and overflow containers
**TypeScript:** Strict mode enabled with proper typing for all components

### File Organization
- `src/app/`: Next.js App Router pages (each major feature has own directory)
- `src/components/ui/`: shadcn/ui components (managed by CLI)
- `src/components/layout/`: Layout-specific components
- `src/components/charts/`: Reusable chart components
- `src/design-system/`: Design tokens, themes, and primitives
- `src/lib/`: Utility functions (mainly `utils.ts` for className merging)

### Adding New Features
1. Create new page directory in `src/app/`
2. Follow existing page patterns (mock data, KPI cards, table)
3. Use `DashboardLayout` wrapper
4. Import charts from `src/components/charts/`
5. Use design tokens for custom styling needs
6. Add navigation item to `AppSidebar` component

### Theme Customization
- Update color tokens in `src/design-system/tokens/colors.ts`
- Modify theme mappings in `src/design-system/themes/default.ts`
- CSS variables are automatically updated in `src/app/globals.css`
- All components inherit theme changes automatically

### Component Development
- Use composition over inheritance patterns
- Export reusable components from barrel files (`index.ts`)
- Follow shadcn/ui patterns for new UI components
- Include proper TypeScript interfaces for all props
- Use `cn()` utility for className merging with proper precedence