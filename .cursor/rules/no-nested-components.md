# No Nested Component Definitions

## Problem

Defining React components inside other components causes:
- Flickering UI elements when parent components re-render
- State resets and lost component state
- Performance degradation
- Unnecessary re-creation of functions and objects

## Rules

1. **Never define components inside other components**
   - Extract all component definitions to separate files or define them at the module level
   - This includes SVG icons, loaders, buttons, etc.

2. **Use React.memo for lightweight components**
   - Always memoize components that render frequently
   - Especially important for icon components and other visual elements

3. **Use useCallback for event handlers**
   - All event handlers passed as props should use useCallback
   - Prevents unnecessary re-renders when passed to child components

4. **Create dedicated files for related components**
   - Group related components in a single file if they're only used together
   - For example: put `PrevButton`, `NextButton`, and `PageIndicator` in a file named `Pagination.tsx`

## Implementation Approach

1. Extract all SVG icons to `/src/components/icons/` directory
2. Move all loading indicators to `/src/components/loaders/` directory
3. Create utility components for common patterns
4. Use higher-order components or render props for complex state sharing

## Examples

❌ **Bad**:
```tsx
const Component = () => {
  // This is bad!
  const Icon = () => <svg>...</svg>;
  
  return <div><Icon /></div>;
};
```

✅ **Good**:
```tsx
// Icon.tsx
import React from 'react';

const Icon = React.memo(() => <svg>...</svg>);
export default Icon;

// Component.tsx
import Icon from './Icon';

const Component = () => {
  return <div><Icon /></div>;
};
``` 