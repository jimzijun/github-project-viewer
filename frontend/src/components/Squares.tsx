import React, { useRef, useEffect, useState } from 'react';
import './Squares.css';
import { useTheme } from '../utils/ThemeContext';

interface SquaresProps {
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  squareBackground?: string;
  className?: string;
  opacity?: number;
}

// Default props for the singleton instance
const defaultProps: SquaresProps = {
  speed: 0.5,
  borderColor: 'var(--squares-border)',
  squareSize: 40,
  squareBackground: 'var(--squares-bg)',
  className: '',
  opacity: 0.25
};

// Singleton state
let singletonProps = { ...defaultProps };
let updateCallback: ((props: Partial<SquaresProps>) => void) | null = null;

// Function to update the singleton props
export const updateSquaresProps = (props: Partial<SquaresProps>) => {
  singletonProps = { ...singletonProps, ...props };
  if (updateCallback) {
    updateCallback(props);
  }
};

const Squares: React.FC<SquaresProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const numSquaresX = useRef<number>(0);
  const numSquaresY = useRef<number>(0);
  const gridOffset = useRef({ x: 0, y: 0 });
  
  const { effectiveTheme } = useTheme();
  
  const [currentProps, setCurrentProps] = useState({
    ...defaultProps,
    ...props
  });
  
  // Register the update callback
  useEffect(() => {
    updateCallback = (newProps) => {
      setCurrentProps(prev => ({ ...prev, ...newProps }));
    };
    
    return () => {
      updateCallback = null;
    };
  }, []);
  
  // Update colors when theme changes
  useEffect(() => {
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--squares-border').trim();
    const squareBackground = getComputedStyle(document.documentElement).getPropertyValue('--squares-bg').trim();
    
    setCurrentProps(prev => ({
      ...prev,
      borderColor,
      squareBackground
    }));
  }, [effectiveTheme]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { 
      speed = defaultProps.speed,
      borderColor = defaultProps.borderColor,
      squareSize = defaultProps.squareSize,
      squareBackground = defaultProps.squareBackground,
      opacity = defaultProps.opacity
    } = currentProps;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      numSquaresX.current = Math.ceil(canvas.width / (squareSize || 40)) + 1;
      numSquaresY.current = Math.ceil(canvas.height / (squareSize || 40)) + 1;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawGrid = () => {
      if (!ctx || !canvas || !squareSize) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startX = Math.floor(gridOffset.current.x / squareSize) * squareSize;
      const startY = Math.floor(gridOffset.current.y / squareSize) * squareSize;

      for (let x = startX; x < canvas.width + squareSize; x += squareSize) {
        for (let y = startY; y < canvas.height + squareSize; y += squareSize) {
          const squareX = x - (gridOffset.current.x % squareSize);
          const squareY = y - (gridOffset.current.y % squareSize);

          // Apply opacity only to the background fill
          const originalAlpha = ctx.globalAlpha;
          ctx.globalAlpha = opacity || 0.25;
          
          // Fill each square with the background color
          ctx.fillStyle = squareBackground || 'transparent';
          ctx.fillRect(squareX, squareY, squareSize, squareSize);
          
          // Reset to original alpha for borders
          ctx.globalAlpha = originalAlpha;

          // Draw borders with full opacity
          ctx.strokeStyle = borderColor || '#999';
          ctx.strokeRect(squareX, squareY, squareSize, squareSize);
        }
      }
    };

    const updateAnimation = () => {
      if (!squareSize) return;
      
      const effectiveSpeed = Math.max(speed || 0.5, 0.1);
      
      // Always move down, no direction switch logic
      gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + squareSize) % squareSize;

      drawGrid();
      requestRef.current = requestAnimationFrame(updateAnimation);
    };

    requestRef.current = requestAnimationFrame(updateAnimation);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [currentProps]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`squares-canvas ${currentProps.className || ''}`}
    ></canvas>
  );
};

// Create a singleton instance component
export const SingletonSquares: React.FC = () => {
  const { effectiveTheme } = useTheme();
  return <Squares {...singletonProps} />;
};

export default Squares; 