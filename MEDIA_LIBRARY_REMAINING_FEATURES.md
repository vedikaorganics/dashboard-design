# Media Library - Remaining Features Implementation Plan

## Current Status

### ✅ Already Implemented:
1. **Browser back/forward navigation** - Working with URL query parameters
2. **URL-based folder navigation** - Using `?folderId=xyz` parameters
3. **Bookmarkable folder URLs** - Direct links to folders work
4. **Basic folder navigation** - Sidebar folder tree exists

### 🔍 Still Needed from Original Plan:

## Phase 1: Path-based URL System

### Convert from ID-based to path-based URLs
- **Current**: `/cms/media?folderId=abc123`
- **Desired**: `/cms/media?path=/folder1/subfolder`
- More intuitive and readable URLs
- Update MediaFolder model to include full path mapping
- Modify folder navigation handlers to work with paths

## Phase 2: Breadcrumb Navigation

### Add Breadcrumb Component
- Create breadcrumb navigation showing full path hierarchy
- Display format: `Home > Folder > Subfolder`
- Make each segment clickable to jump to that level
- Place at top of media library content area
- Style to match existing UI design system
- Update on folder navigation

## Phase 3: Enhanced Grid Navigation

### Double-click Folder Navigation in Grid
- Display folders in main grid view (not just sidebar)
- Add double-click handler to open folders from grid
- Show folder icons distinct from file icons
- Add hover states and visual feedback for folders
- Maintain existing file display functionality

## Phase 4: Context Menus

### Right-click Context Menus
- Implement context menu component
- **Folder actions**: Rename, Delete, Move, Open
- **File actions**: Rename, Delete, Move, Download, Preview
- Different menus for files vs folders
- Integrate with existing CMS action handlers
- Keyboard shortcut support (Shift+F10)

## Phase 5: Keyboard Navigation

### Keyboard Shortcuts
- **Arrow keys**: Navigate between files/folders in grid
- **Enter**: Open folders or preview files
- **Delete**: Delete selected items (with confirmation)
- **Escape**: Deselect all items
- **Ctrl+A**: Select all items
- **F2**: Rename selected item
- Tab navigation for accessibility

## Phase 6: Inline Editing

### Inline Rename Functionality
- Click on file/folder name to enter edit mode
- **Save**: Enter key or click outside
- **Cancel**: Escape key
- Validate names before saving
- Show loading state during save
- Handle duplicate name errors

## Phase 7: Toolbar Enhancements

### Up Navigation Button
- Add "Up" button to existing toolbar
- Navigate to parent folder
- Disable/hide button at root level
- Keyboard shortcut: Alt+Up
- Tooltip: "Up one level"

## Technical Implementation Details

### File Structure Updates
```
src/components/cms/media-library/
├── MediaBreadcrumb.tsx          (NEW)
├── MediaContextMenu.tsx         (NEW) 
├── MediaFolderGrid.tsx          (ENHANCE)
├── MediaKeyboardHandler.tsx     (NEW)
├── MediaInlineEditor.tsx        (NEW)
└── MediaToolbar.tsx             (ENHANCE)
```

### API Considerations
- Maintain existing CMS API endpoints
- Add path-to-ID resolution for backward compatibility
- Ensure folder operations work with both path and ID systems
- Cache folder path mappings for performance

### State Management
- Extend existing folder state to include path information
- Add keyboard navigation state tracking
- Manage inline editing state
- Handle context menu visibility

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation compliance
- Screen reader announcements for folder changes
- Focus management during navigation

## Priority Order

1. **High Priority**: Breadcrumb navigation (most visible UX improvement)
2. **High Priority**: Path-based URLs (cleaner, more intuitive)
3. **Medium Priority**: Double-click folder navigation (expected behavior)
4. **Medium Priority**: Context menus (power user features)
5. **Low Priority**: Keyboard navigation (nice-to-have)
6. **Low Priority**: Inline editing (convenience feature)
7. **Low Priority**: Up button (redundant with breadcrumbs)

## Success Criteria

- Users can navigate folder hierarchy intuitively
- URLs are human-readable and bookmarkable
- Browser back/forward works naturally
- Keyboard users can navigate effectively
- Context actions are discoverable
- Performance remains smooth with large folder structures
- All existing CMS functionality preserved