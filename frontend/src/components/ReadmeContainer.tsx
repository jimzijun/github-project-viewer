import React, { useState, useEffect, useRef } from 'react';
import { ReadmeContainerProps } from '../types';
import styled from '@emotion/styled';
import { updateSquaresProps } from './Squares';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import rehypeRaw from 'rehype-raw';
import rehypePrism from 'rehype-prism-plus';
import { useTheme } from '../utils/ThemeContext';
import 'github-markdown-css/github-markdown.css';
import 'prismjs/themes/prism-tomorrow.css'; // Import a PrismJS theme

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
  will-change: transform; /* Optimize for animations */
`;

const Content = styled.div`
  width: 100%;
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(8px);
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
    
    /* Simplified token styles that work with both themes */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      opacity: 0.6;
    }
    
    .token.punctuation {
      opacity: 0.8;
    }
    
    .token.tag,
    .token.attr-name,
    .token.namespace,
    .token.deleted {
      color: var(--primary-color);
    }
    
    .token.function-name {
      color: var(--primary-hover);
    }
    
    .token.boolean,
    .token.number,
    .token.function {
      color: var(--primary-hover);
    }
    
    .token.property,
    .token.class-name,
    .token.constant,
    .token.symbol {
      color: var(--primary-color);
    }
    
    .token.selector,
    .token.important,
    .token.atrule,
    .token.keyword,
    .token.builtin {
      color: var(--error-color);
    }
    
    .token.string,
    .token.char,
    .token.attr-value,
    .token.regex,
    .token.variable {
      color: var(--primary-color);
    }
    
    .token.operator,
    .token.entity,
    .token.url {
      color: var(--text-color);
    }
    
    .token.important,
    .token.bold {
      font-weight: bold;
    }
    
    .token.italic {
      font-style: italic;
    }
    
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

// Drag indicator
const DragIndicator = styled.div<{ show: boolean }>`
  position: absolute;
  bottom: 70px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  opacity: ${props => props.show ? 0.8 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 100;
`;

const ReadmeContainer: React.FC<ReadmeContainerProps> = ({ 
  readme,
  projectName,
  toggleCardVisibility,
  isCardVisible
}) => {
  const { effectiveTheme } = useTheme();
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [showDragTip, setShowDragTip] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Use simpler approach: only protect semicolons in patterns like TL;DR
  // Don't touch emoji characters at all
  const processedReadme = readme 
    ? readme
        // Only fix specific patterns that might be misinterpreted
        .replace(/TL;DR/gi, 'TL&#59;DR')
        // Remove the specific garbled characters if they appear
        .replace(/ð(?:\s*ï¸)?/g, '')
    : `# ${projectName}\n\nNo README available.`;
  
  // Listen for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Only set speed, no direction
        setAnimationSpeed(1);
        updateSquaresProps({ speed: 1 });
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        // Only set speed, no direction
        setAnimationSpeed(0.7);
        updateSquaresProps({ speed: 0.7 });
      }
    };
    
    const handleKeyUp = () => {
      // Slow down animation after key release
      setTimeout(() => {
        setAnimationSpeed(0.5);
        updateSquaresProps({ speed: 0.5 });
      }, 300);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Show drag tip after 2 seconds, hide after 8 seconds
    const showTimer = setTimeout(() => setShowDragTip(true), 2000);
    const hideTimer = setTimeout(() => setShowDragTip(false), 8000);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        toggleCardVisibility();
      }
    };
    
    const handleKeyUp = () => {
      // Reset any key up logic if needed
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [toggleCardVisibility]);

  useEffect(() => {
    // When scrolling, increase grid opacity
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    
    let throttleTimer: number | null = null;
    
    const handleScroll = () => {
      if (throttleTimer !== null) return;
      
      throttleTimer = window.setTimeout(() => {
        throttleTimer = null;
      }, 100);
    };
    
    wrapper.addEventListener('scroll', handleScroll);
    return () => {
      wrapper.removeEventListener('scroll', handleScroll);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, []);

  return (
    <MainContainer>
      <ContentWrapper 
        ref={wrapperRef}
        onMouseEnter={() => setShowDragTip(true)}
        onMouseLeave={() => setShowDragTip(false)}
      >
        <ContentContainer>
          <Content className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[
                remarkGfm, 
                [remarkEmoji, { 
                  padSpaceAfter: true,
                  emoticon: false  // Disable emoticon conversion to prevent things like ;D from becoming emojis
                }]
              ]}
              rehypePlugins={[
                rehypeRaw, 
                [rehypePrism, {
                  showLineNumbers: true, // Enable line numbers
                  ignoreMissing: true,   // Don't throw on missing language
                  alias: {              // Language aliases
                    sh: 'bash',
                    shell: 'bash',
                    js: 'javascript',
                    ts: 'typescript',
                    md: 'markdown'
                  }
                }]
              ]}
            >
              {processedReadme}
            </ReactMarkdown>
          </Content>
        </ContentContainer>
      </ContentWrapper>
      
      <DragIndicator show={showDragTip}>
        Move your mouse over the grid and use arrow keys to speed up animation
      </DragIndicator>
    </MainContainer>
  );
};

export default ReadmeContainer; 