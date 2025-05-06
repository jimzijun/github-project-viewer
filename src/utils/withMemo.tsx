import React from 'react';

/**
 * Higher-order component to memoize React components
 * Use this to prevent unnecessary re-renders
 * 
 * @example
 * // Instead of:
 * const MyComponent = () => <div>Content</div>;
 * export default React.memo(MyComponent);
 * 
 * // You can use:
 * const MyComponent = () => <div>Content</div>;
 * export default withMemo(MyComponent);
 * 
 * @param Component - React component to memoize
 * @returns Memoized component
 */
export function withMemo<T>(Component: React.ComponentType<T>) {
  return React.memo(Component);
}

/**
 * Creates a memoized SVG icon component
 * 
 * @example
 * export const CloseIcon = createIcon(() => (
 *   <svg width="24" height="24" viewBox="0 0 24 24">
 *     <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} />
 *   </svg>
 * ));
 * 
 * @param renderFn - Function that renders the SVG
 * @returns Memoized SVG component
 */
export function createIcon<T = {}>(renderFn: React.FC<T>) {
  return React.memo(renderFn);
}

export default withMemo; 