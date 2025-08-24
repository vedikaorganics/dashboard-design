# E-commerce Dashboard

A modern, fully-featured e-commerce dashboard built with Next.js 15, TypeScript, and shadcn/ui components.

## Features

### 🎨 Design System
- **Centralized Design Tokens**: Colors, spacing, and typography tokens for consistent theming
- **Theme Support**: Light/dark mode with seamless switching
- **Component Library**: Built on shadcn/ui with custom extensions
- **Responsive Design**: Mobile-first approach with optimal tablet and desktop layouts

### 📊 Dashboard Pages
- **Dashboard**: Overview with KPI cards and analytics charts
- **Orders**: Order management with status tracking and filtering
- **Users**: User management with roles and activity tracking
- **Reviews**: Product review management and moderation
- **Campaigns**: Marketing campaign tracking and performance
- **Products**: Inventory management with stock levels
- **Offers**: Discount codes and promotional management
- **Staff**: Team member management with permissions

### 🧩 Components
- **Reusable Charts**: Area, Bar, Line, and Pie charts with Recharts
- **Data Tables**: Sortable, filterable tables with actions
- **Navigation**: Collapsible sidebar with grouped menu items
- **Forms**: Accessible form components with validation
- **Cards**: Statistical cards with trend indicators
- **Modals & Dialogs**: Overlay components for actions

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with CSS-in-JS
- **UI Components**: shadcn/ui component library
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Geist Sans and Geist Mono
- **Theme**: next-themes for dark/light mode

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── campaigns/         # Campaign management
│   ├── offers/           # Offers and discounts
│   ├── orders/           # Order management
│   ├── products/         # Product catalog
│   ├── reviews/          # Review management
│   ├── staff/            # Staff management
│   └── users/            # User management
├── components/
│   ├── charts/           # Reusable chart components
│   ├── layout/           # Layout components
│   ├── ui/               # shadcn/ui components
│   └── theme-provider.tsx
├── design-system/        # Design system tokens and themes
│   ├── tokens/           # Design tokens
│   ├── themes/           # Theme configurations
│   └── primitives/       # Base component variants
├── hooks/                # Custom React hooks
└── lib/                  # Utilities and configurations
```

## Design System Architecture

### Benefits

1. **Single Source of Truth**: All design decisions centralized in tokens
2. **Easy Theme Switching**: Runtime theme changes without code modifications
3. **Minimal Duplication**: Reusable components and consistent patterns
4. **Future-Proof**: Simple to overhaul entire UI with token updates
5. **Type-Safe**: TypeScript ensures design consistency
6. **Scalable**: Component composition over inheritance

### Customization

**Colors**: Update `src/design-system/tokens/colors.ts`
**Spacing**: Modify `src/design-system/tokens/spacing.ts`
**Typography**: Edit `src/design-system/tokens/typography.ts`
**Themes**: Adjust `src/design-system/themes/default.ts`

## Key Features in Detail

### Dashboard Overview
- Revenue, orders, users, and products KPI cards
- Interactive charts showing trends and breakdowns
- Quick action shortcuts
- Recent activity feed

### Management Pages
- **Sortable Tables**: Click headers to sort data
- **Search & Filter**: Find specific items quickly
- **Bulk Actions**: Perform actions on multiple items
- **Export Data**: Download reports and data
- **Real-time Updates**: Live data synchronization

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Tablet-Friendly**: Adapted layouts for tablets
- **Desktop Enhanced**: Full feature set on desktop
- **Touch-Friendly**: Appropriate touch targets

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Friendly**: Proper ARIA labels
- **High Contrast**: Accessible color combinations
- **Focus Management**: Clear focus indicators

## Development

### Adding New Pages
1. Create page component in `src/app/`
2. Use `DashboardLayout` wrapper
3. Follow existing patterns for consistency

### Creating Components
1. Build with composition in mind
2. Use design system tokens
3. Include TypeScript types
4. Add responsive classes

### Extending Charts
1. Add new chart types in `src/components/charts/`
2. Follow existing chart component patterns
3. Ensure responsive behavior
4. Include proper TypeScript types

## Performance

- **Optimized Bundle**: Tree-shaking and code splitting
- **Image Optimization**: Next.js automatic optimization
- **CSS Optimization**: Tailwind CSS purging
- **TypeScript**: Static analysis and optimization

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Browsers**: iOS Safari, Chrome Mobile
- **Minimum**: ES2020 support required

## Contributing

1. Follow TypeScript strict mode
2. Use existing component patterns
3. Maintain responsive design principles
4. Include proper accessibility features
5. Test across different screen sizes