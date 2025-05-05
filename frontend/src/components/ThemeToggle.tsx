import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../utils/ThemeContext';

const ToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
`;

const ButtonGroup = styled.div`
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-color);
`;

const ThemeButton = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 8px 10px;
  background: ${props => props.isActive ? 'var(--primary-color)' : 'var(--card-bg)'};
  color: ${props => props.isActive ? 'var(--button-text)' : 'var(--text-color)'};
  border: none;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.isActive ? 'var(--primary-hover)' : 'var(--secondary-bg)'};
  }
`;

// Icons for theme buttons
const LightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="3" x2="12" y2="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="23" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="3" y1="12" x2="1" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="23" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DarkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AutoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 21v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <ToggleContainer>
      <Label>Theme</Label>
      <ButtonGroup>
        <ThemeButton 
          isActive={theme === 'light'} 
          onClick={() => setTheme('light')}
          aria-label="Light theme"
        >
          <LightIcon />
          Light
        </ThemeButton>
        <ThemeButton 
          isActive={theme === 'dark'} 
          onClick={() => setTheme('dark')}
          aria-label="Dark theme"
        >
          <DarkIcon />
          Dark
        </ThemeButton>
        <ThemeButton 
          isActive={theme === 'auto'} 
          onClick={() => setTheme('auto')}
          aria-label="Auto theme (system preference)"
        >
          <AutoIcon />
          Auto
        </ThemeButton>
      </ButtonGroup>
    </ToggleContainer>
  );
};

export default ThemeToggle; 