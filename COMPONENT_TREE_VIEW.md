# Component Tree View

A standalone component tree view feature that provides a hierarchical visualization of UIComponent elements in your Laminar application.

## Features

### 🚀 **Quick Access**
- **Keyboard Shortcut**: `Alt + Shift + Cmd` to open/close
- **Floating Panel**: Intelligent positioning with viewport awareness
- **Responsive Design**: Adapts to different screen sizes

### 🌳 **Tree Functionality**
- **Hierarchical Display**: Shows component parent-child relationships
- **Collapsible Nodes**: Expand/collapse with visual indicators
- **Component Metadata**: Displays component names, file paths, and line numbers
- **Real-time Updates**: Automatically refreshes when components change

### ⌨️ **Keyboard Navigation**
- `↑/↓` - Navigate up/down through tree
- `←/→` - Expand/collapse nodes or navigate to parent/child
- `Enter/Space` - Toggle expansion or open file
- `Escape` - Close tree view
- `Home/End` - Jump to first/last item

### 🖱️ **Mouse Interaction**
- **Hover Integration**: Hover over tree items to highlight corresponding page components
- **Click Actions**: Single click to select, double click to open file
- **Context Menu**: Right-click for additional options
- **Visual Feedback**: Smooth animations and hover states

### 🎨 **Visual Design**
- **Modern UI**: Clean, minimal design with subtle shadows and borders
- **Consistent Theming**: Uses existing CSS custom properties
- **Visual Hierarchy**: Clear indentation and iconography
- **Smooth Animations**: Polished expand/collapse transitions

### ⚡ **Performance**
- **Lazy Loading**: Efficient rendering for large component trees
- **Caching**: Smart caching of tree data and rendered elements
- **Throttling**: Optimized refresh handling for dynamic updates
- **Memory Management**: Proper cleanup and resource management

## Usage

### Opening the Tree View
Press `Alt + Shift + Cmd` anywhere in your application to open the component tree view.

### Navigation
- Use arrow keys to navigate through the tree structure
- Press `Enter` to open the source file for a component
- Use `Escape` to close the tree view

### Tree Operations
- Click the arrow icons to expand/collapse nodes
- Right-click on any item for context menu options:
  - Open File
  - Copy Path
  - Expand All Children
  - Collapse All Children

### Integration with Existing Features
The tree view seamlessly integrates with the existing locator system:
- Hovering over tree items highlights the corresponding component on the page
- Uses the same overlay and tooltip system for consistent visual feedback
- Respects existing keyboard navigation patterns

## Technical Details

### Architecture
- **Class-based Design**: `ComponentTreeView` class with clear separation of concerns
- **Event-driven**: Uses observer pattern for state management
- **Performance Optimized**: Includes throttling, caching, and lazy loading
- **Responsive**: Adapts layout based on viewport size

### Integration Points
- **UIComponent System**: Leverages existing `@uicomponent` annotations
- **LocatorSystem**: Uses existing component discovery and overlay functionality
- **CSS Custom Properties**: Maintains consistency with existing theme
- **Keyboard Navigation**: Integrates with existing `KeyboardNavigator` class

### Browser Support
- Modern browsers with ES6+ support
- CSS custom properties support
- Intersection Observer API (with graceful fallback)
- Mutation Observer API (with graceful fallback)

## Customization

The tree view uses CSS custom properties for easy theming:

```css
:root {
  --tree-panel-width: 340px;
  --tree-panel-max-height: 70vh;
  --tree-item-height: 32px;
  --tree-item-indent: 24px;
  --tree-text-font-size: 13px;
  /* ... and many more */
}
```

## Troubleshooting

### Tree View Not Opening
- Ensure you're pressing the correct key combination: `Alt + Shift + Cmd`
- Check browser console for any JavaScript errors

### Components Not Showing
- Verify that components are properly annotated with `@uicomponent` or extend `UIComponent`
- Check that the locator system is properly initialized

### Performance Issues
- The tree view includes automatic performance optimizations
- For very large component trees, consider using the collapse/expand functionality to reduce visible nodes

## Future Enhancements

Potential future improvements could include:
- Search/filter functionality within the tree
- Component dependency visualization
- Export tree structure to various formats
- Integration with development tools
- Component statistics and metrics display
