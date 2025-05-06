import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { ReadmeContainerProps } from '../types';
import styled from '@emotion/styled';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import rehypeRaw from 'rehype-raw';
import 'github-markdown-css/github-markdown.css';
import LoadingSpinner from './LoadingSpinner';

const MainContainer = styled.div`
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  perspective: 1000px;
  background: transparent;
  z-index: 1;
`;

const ContentWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 2;
  padding: 2rem;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  backface-visibility: hidden; /* Prevent flickering in some browsers */
  will-change: scroll-position; /* Hint for browser to optimize scrolling */
  transform: translateZ(0); /* Hardware acceleration */
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb);
    border-radius: 3px;
  }
`;

const ContentContainer = styled.div`
  max-width: 800px;
  width: 100%;
  margin: 0 auto 2rem auto;
  display: flex;
  flex-direction: column;
  background: transparent;
  transform: translateZ(0); /* Hardware acceleration for smoother rendering */
`;

const Content = styled.div`
  width: 100%;
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  /* Only use backdrop-filter on high-end devices */
  @supports (backdrop-filter: blur(8px)) {
    backdrop-filter: blur(8px);
  }
  overflow-wrap: break-word;
  word-wrap: break-word;
  position: relative;
  z-index: 2;
  transform: translateZ(0); /* Hardware acceleration */
  
  /* Customize the GitHub Markdown theme */
  &.markdown-body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: var(--text-color);
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      color: var(--text-color);
      font-weight: 600;
    }
    
    h1 {
      font-size: 2.2rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.3em;
    }
    
    h2 {
      font-size: 1.8rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.3em;
    }
    
    p {
      margin: 1em 0;
      line-height: 1.6;
    }
    
    a {
      color: var(--primary-color);
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    code {
      background-color: var(--code-bg);
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 85%;
      padding: 0.2em 0.4em;
      max-width: 100%;
      overflow-x: auto;
      display: inline-block;
    }
    
    pre {
      background-color: var(--secondary-bg) !important; /* Dark background for code blocks */
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      overflow-x: auto;
      position: relative; /* Needed for line numbers positioning */
      
      /* Add styling for code block with line numbers */
      &[data-line] {
        padding-left: 3.8em;
      }
      
      /* Line highlight styling */
      .highlight-line {
        background-color: rgba(255, 255, 255, 0.1);
        display: block;
        margin-right: -1em;
        margin-left: -1em;
        padding-right: 1em;
        padding-left: 0.75em;
        border-left: 0.25em solid var(--primary-color);
      }
      
      /* Line number styling */
      .line-number-style {
        display: inline-block;
        width: 2em;
        user-select: none;
        opacity: 0.6;
        text-align: center;
        position: relative;
      }
      
      code {
        background-color: transparent;
        padding: 0;
        white-space: pre;
        display: block;
        color: var(--text-color); /* Light gray text for better contrast */
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 14px;
        line-height: 1.5;
      }
    }
    
    /* Removed PrismJS token styling here */
    
    ul, ol {
      padding-left: 2em;
      margin: 1em 0;
      
      li {
        margin: 0.25em 0;
      }
    }
    
    img {
      max-width: 100%;
      box-shadow: var(--card-shadow);
      border-radius: 4px;
    }
    
    blockquote {
      padding: 0 1em;
      color: var(--text-color);
      opacity: 0.7;
      border-left: 0.25em solid var(--border-color);
    }
    
    table {
      display: block;
      width: 100%;
      overflow: auto;
      margin: 1em 0;
      border-spacing: 0;
      border-collapse: collapse;
      
      tr {
        background-color: transparent;
        border-top: 1px solid var(--border-color);
        
        &:nth-child(2n) {
          background-color: var(--secondary-bg);
        }
      }
      
      th, td {
        padding: 6px 13px;
        border: 1px solid var(--border-color);
      }
      
      th {
        font-weight: 600;
      }
    }
  }
`;

// Loading container with animation
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: fadeIn 0.5s ease-in-out forwards;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: var(--text-color);
  font-size: 14px;
  opacity: 0.7;
`;

// Create a simple LRU cache with maximum size to prevent memory issues
class LRUCache {
  private cache: Map<string, boolean>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  has(key: string): boolean {
    const hasKey = this.cache.has(key);
    if (hasKey) {
      // Access refreshes the entry (moves it to the end)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value!);
    }
    return hasKey;
  }

  add(key: string): void {
    // Delete the key if it exists to refresh its position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Check if we need to evict the oldest item
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // Add the new key
    this.cache.set(key, true);
  }
}

// Replace the unlimited Set with a size-limited LRU cache
const imageLoadedCache = new LRUCache(150);

// Create a proper React component for images using memo
const MarkdownImage = React.memo(({ 
  src, 
  alt, 
  ownerLogin, 
  projectName, 
  ...props 
}: { 
  src: string; 
  alt?: string;
  ownerLogin: string;
  projectName: string;
  [key: string]: any;
}) => {
  // Transform URL if needed
  let imageSrc = src || '';
  if (src && !src.startsWith('http') && !src.startsWith('data:')) {
    // Convert to GitHub raw content URL
    imageSrc = `https://raw.githubusercontent.com/${ownerLogin}/${projectName}/main/${src}`;
  }
  
  // Check if this image has already been loaded before
  const isPreloaded = imageLoadedCache.has(imageSrc);
  const [isLoaded, setIsLoaded] = useState(isPreloaded);
  
  const handleImageLoad = useCallback(() => {
    imageLoadedCache.add(imageSrc);
    setIsLoaded(true);
    if (props.onLoad) props.onLoad();
  }, [imageSrc, props.onLoad]);
  
  return (
    <div style={{ 
      position: 'relative', 
      display: 'inline-block', 
      minHeight: '24px', 
      minWidth: '24px' 
    }}>
      {/* Spinner element - only show if image isn't loaded */}
      <div 
        className="image-spinner"
        style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
      >
        <LoadingSpinner size={24} />
      </div>
      
      {/* Image element */}
      <img
        {...props}
        src={imageSrc}
        alt={alt || ''}
        style={{
          ...props.style,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        onLoad={handleImageLoad}
      />
    </div>
  );
});

// Create markdown components factory function with memoized components
const createMarkdownComponents = (ownerLogin: string, projectName: string) => ({
  img: (props: any) => (
    <MarkdownImage
      {...props}
      ownerLogin={ownerLogin}
      projectName={projectName}
    />
  )
});

// Define interface for MemoizedMarkdown props
interface MemoizedMarkdownProps {
  children: string;
  components: ReturnType<typeof createMarkdownComponents>;
}

// Create a memoized markdown renderer component
const MemoizedMarkdown = memo(({ children, components }: MemoizedMarkdownProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkEmoji]}
    rehypePlugins={[rehypeRaw]}
    components={components}
  >
    {children}
  </ReactMarkdown>
));

const ReadmeContainer: React.FC<ReadmeContainerProps> = ({ 
  readme,
  projectName,
  ownerLogin,
  toggleCardVisibility,
  isCardVisible,
  isLoading = false
}) => {
  // Content wrapper ref
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  
  // Throttle scroll event handling
  const throttledScroll = useCallback(() => {
    let isScrolling: NodeJS.Timeout;
    
    return () => {
      // Clear our timeout throughout the scroll
      window.clearTimeout(isScrolling);
      
      // Set a timeout to run after scrolling ends
      isScrolling = setTimeout(() => {
        if (contentWrapperRef.current) {
          const scrollTop = contentWrapperRef.current.scrollTop;
          
          // Only toggle card visibility based on scroll after the scroll has settled
          if (scrollTop > 50 && isCardVisible) {
            toggleCardVisibility();
          } else if (scrollTop <= 50 && !isCardVisible) {
            toggleCardVisibility();
          }
        }
      }, 100); // 100ms delay before executing
    };
  }, [isCardVisible, toggleCardVisibility]);
  
  // Initialize scrolling once, not on every render
  useEffect(() => {
    const handleScroll = throttledScroll();
    const contentWrapper = contentWrapperRef.current;
    
    if (contentWrapper) {
      contentWrapper.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    return () => {
      if (contentWrapper) {
        contentWrapper.removeEventListener('scroll', handleScroll);
      }
    };
  }, [throttledScroll]);
  
  // Memoize the markdown components
  const markdownComponents = useMemo(() => 
    createMarkdownComponents(ownerLogin, projectName), 
    [ownerLogin, projectName]
  );
  
  return (
    <MainContainer>
      <ContentWrapper ref={contentWrapperRef}>
        <ContentContainer>
          {isLoading ? (
            <Content className="markdown-body">
              <div className="loading-container">
                <LoadingSpinner size={40} />
                <div className="loading-text">Loading README...</div>
              </div>
            </Content>
          ) : (
            <Content className="markdown-body">
              <MemoizedMarkdown components={markdownComponents}>
                {readme || `# No README available for ${projectName}`}
              </MemoizedMarkdown>
            </Content>
          )}
        </ContentContainer>
      </ContentWrapper>
    </MainContainer>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default memo(ReadmeContainer); 