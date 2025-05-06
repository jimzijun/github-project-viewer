import React from 'react';
import styled from '@emotion/styled';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

const SpinnerContainer = styled.div<{ size: number }>`
  display: inline-block;
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
`;

const Spinner = styled.div<{ size: number; color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: ${props => Math.max(2, props.size / 10)}px solid;
  border-color: ${props => props.color} transparent ${props => props.color} transparent;
  animation: spin 1.2s linear infinite;
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 24, 
  color,
  className
}) => {
  // Use the provided color or fall back to primary-color from theme
  const spinnerColor = color || 'var(--primary-color)';
  
  return (
    <SpinnerContainer size={size} className={className}>
      <Spinner size={size} color={spinnerColor} />
    </SpinnerContainer>
  );
};

export default LoadingSpinner; 