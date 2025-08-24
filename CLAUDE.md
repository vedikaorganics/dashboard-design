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

### Theming Structure
This project follows shadcn/ui theming conventions:

- **CSS Variables** (`src/app/globals.css`): Uses CSS variables as the single source of truth for colors and design tokens
- **Theme Provider** (`src/components/theme-provider.tsx`): next-themes integration for light/dark mode switching
- **Tailwind Integration**: CSS variables mapped to Tailwind utilities for consistent theming across components

Theming is handled entirely through CSS variables, enabling easy UI overhauls by modifying variable values in `globals.css`.

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
- **Database:** MongoDB with native driver (not Mongoose) for optimal performance
- **API Routes:** RESTful endpoints in `src/app/api/*/route.ts` with parallel query execution
- **Data Fetching:** Custom React hooks in `src/hooks/use-data.ts` using native fetch
- **Caching:** In-memory cache (`src/lib/cache.ts`) with aggressive TTLs for blazing fast performance
- **State Management:** React state with custom hooks, no global state management needed
- Status badges use variant mapping objects for consistent styling
- Actions use shadcn/ui DropdownMenu components

### MongoDB Integration
**Connection:** `src/lib/mongodb.ts` handles connection pooling with these optimizations:
- Connection pooling (maxPoolSize: 10) for concurrent requests
- Server selection timeout: 5 seconds
- Socket timeout: 45 seconds for inactive connections
- Development HMR support with global connection reuse

**Environment Setup:** Requires `MONGODB_URI` in `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

### API Architecture
**Performance Features:**
- Parallel query execution for complex data aggregation
- In-memory caching with TTL (Time To Live) strategy:
  - Dashboard overview: 60 seconds
  - Orders/Users: 30-300 seconds  
  - Products: 600 seconds (rarely change)
  - Staff: 900 seconds (changes rarely)
- Data enrichment (orders with user data, products with variants/reviews)
- Pagination and filtering support

**Available Endpoints:**
- `/api/dashboard` - KPI metrics and overview data
- `/api/orders` - Orders with pagination, filtering, and user data
- `/api/products` - Products with variants, reviews, and pricing
- `/api/users` - Customers with analytics and order history
- `/api/offers` - Promotions with usage statistics
- `/api/campaigns` - UTM analytics from order data
- `/api/reviews` - Product reviews with moderation
- `/api/staff` - Staff management with role permissions

### Page Structure Pattern
Each management page follows this structure:
1. Custom hook for API data fetching (`useOrders()`, `useProducts()`, etc.)
2. Loading states and error handling
3. Helper functions for badges/status rendering  
4. Main component with DashboardLayout wrapper
5. KPI cards grid using API data with responsive classes
6. Main content card with search/filter controls
7. Responsive data table with API data and overflow handling

### Key Technical Decisions

**Styling:** Uses Tailwind CSS v4 with CSS-in-JS approach and CSS variables for theming
**Components:** Built on shadcn/ui (Radix UI primitives) with custom theming
**Database:** MongoDB with native driver for maximum performance and flexibility
**Data Fetching:** Custom hooks with in-memory caching, no external libraries like SWR
**State Management:** React state with custom hooks, no global state management needed
**Responsive Strategy:** Mobile-first with responsive grid classes and overflow containers
**TypeScript:** Strict mode enabled with proper typing and null safety for API responses
**Performance:** Aggressive caching, parallel queries, connection pooling for "blazing fast" UX

### File Organization
- `src/app/`: Next.js App Router pages (each major feature has own directory)
- `src/app/api/`: API route handlers for MongoDB data (`*/route.ts` pattern)
- `src/components/ui/`: shadcn/ui components (managed by CLI)
- `src/components/layout/`: Layout-specific components
- `src/components/charts/`: Reusable chart components
- `src/components/theme-provider.tsx`: Theme provider for light/dark mode
- `src/lib/`: Utility functions (`utils.ts`, `mongodb.ts`, `cache.ts`)
- `src/hooks/`: Custom React hooks for data fetching (`use-data.ts`)
- `src/types/`: TypeScript interfaces matching MongoDB schema

### Adding New Features
1. **API Route:** Create new endpoint in `src/app/api/[feature]/route.ts`
   - Use MongoDB aggregation pipelines for complex queries
   - Implement caching with appropriate TTL
   - Add proper error handling and TypeScript types
2. **Custom Hook:** Add data fetching hook in `src/hooks/use-data.ts`
   - Follow existing naming convention (e.g., `useNewFeature()`)
   - Include pagination and filtering if needed
3. **Page Component:** Create new page directory in `src/app/`
   - Use `"use client"` directive for data fetching hooks
   - Follow existing page patterns (API hooks, KPI cards, table)
   - Use `DashboardLayout` wrapper
4. **Integration:** Import charts from `src/components/charts/` if needed
5. **Styling:** Use CSS variables and Tailwind utilities for custom styling needs
6. **Navigation:** Add navigation item to `AppSidebar` component

### Theme Customization
- Update CSS variables in `src/app/globals.css` (`:root` for light mode, `.dark` for dark mode)
- Variables use OKLCH color format for modern color handling
- All components inherit theme changes automatically through Tailwind utilities
- Toggle between light/dark modes using the theme provider

### Component Development
- Use composition over inheritance patterns
- Export reusable components from barrel files (`index.ts`)
- Follow shadcn/ui patterns for new UI components
- Include proper TypeScript interfaces for all props
- Use `cn()` utility for className merging with proper precedence

## Development Best Practices

### Database Connection Testing
Test MongoDB connection during development:
```bash
# Check if MongoDB URI is valid
node -e "const { MongoClient } = require('mongodb'); new MongoClient(process.env.MONGODB_URI).connect().then(() => console.log('Connected')).catch(console.error)"
```

### Cache Management
Clear cache during development:
- Cache automatically expires based on TTL
- Manual clearing: `cache.clear()` in API routes
- Development: restart server to clear all caches

### Performance Monitoring
- Monitor API response times in browser DevTools
- Check MongoDB connection pool usage
- Watch for cache hit/miss ratios in development

## Troubleshooting

### Common Issues

**"use client" Directive Missing:**
- Error: "Attempted to call useXxx() from the server"
- Solution: Add `"use client"` at top of page components using hooks

**MongoDB Connection Errors:**
- Check `MONGODB_URI` environment variable
- Verify network connectivity and database permissions
- Ensure connection string includes database name

**Null/Undefined Field Errors:**
- API data may have missing fields compared to mock data
- Always use optional chaining: `user.name?.toLowerCase()`
- Provide fallbacks: `user.name || 'Unknown'`
- Type cast API responses: `(data as any)?.field`

**TypeScript API Response Types:**
```typescript
// Pattern used throughout the app
const { data: usersData, isLoading } = useUsers()
const users = (usersData as any)?.users || []
const pagination = (usersData as any)?.pagination || {}
```

**Cache Not Updating:**
- Check TTL values in API routes
- Verify cache keys are unique per query/filter
- Clear cache manually during development if needed

### Performance Optimization Tips
- Use parallel queries in API routes with `Promise.all()`
- Set appropriate TTL values based on data change frequency
- Batch database operations when possible  
- Use MongoDB aggregation pipelines for complex queries
- Implement pagination for large datasets