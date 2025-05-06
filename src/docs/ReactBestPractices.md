# React Component Best Practices

## Component Structure

### 1. No Nested Component Definitions

**Never define components inside other components.** This causes components to be recreated on every render, which can lead to:
- Flickering UI elements
- State resets
- Performance degradation
- Memory issues in large applications

```jsx
// ❌ BAD: Defining a component inside another component
function ParentComponent() {
  // This is recreated on every render!
  function ChildComponent() {
    return <div>Child content</div>;
  }
  
  return <div><ChildComponent /></div>;
}

// ✅ GOOD: Define components separately
function ChildComponent() {
  return <div>Child content</div>;
}

function ParentComponent() {
  return <div><ChildComponent /></div>;
}
```

### 2. Extract Components to Separate Files

Organize components in separate files for better maintainability.

```
src/
  components/
    Button.tsx
    Card.tsx
    icons/
      HomeIcon.tsx
      SettingsIcon.tsx
```

### 3. Use React.memo for Pure Components

Use `React.memo` to prevent unnecessary re-renders of components.

```jsx
// Use our utility function
import { withMemo } from '../utils/withMemo';

const ExpensiveComponent = () => {
  // Component logic...
  return <div>...</div>;
};

export default withMemo(ExpensiveComponent);
```

## Performance Optimization

### 1. Use useCallback for Event Handlers

Always use `useCallback` for functions passed as props to child components.

```jsx
const handleClick = useCallback(() => {
  // Handle click logic
}, [dependency1, dependency2]);
```

### 2. Use useMemo for Expensive Calculations

```jsx
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

### 3. Avoid Anonymous Functions in JSX

```jsx
// ❌ BAD: Creates a new function on every render
<Button onClick={() => handleClick(id)} />

// ✅ GOOD: Use useCallback
const handleButtonClick = useCallback(() => {
  handleClick(id);
}, [id, handleClick]);

<Button onClick={handleButtonClick} />
```

## SVG Icons and UI Elements

### 1. Extract SVG Icons to Separate Files

```jsx
// icons/CloseIcon.tsx
import { createIcon } from '../utils/withMemo';

export const CloseIcon = createIcon(() => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} />
  </svg>
));
```

### 2. Create UI Component Libraries

Group related UI components into logical libraries to promote reuse.

## State Management

### 1. Keep State as Local as Possible

Only lift state up when necessary.

### 2. Use Context API Wisely

Don't overuse Context for everything - it can lead to unnecessary re-renders.

## Testing

Write tests for components to ensure they behave as expected even after refactoring. 