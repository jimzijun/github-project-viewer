import React from 'react';
import styled from '@emotion/styled';
import { useTheme } from '../utils/ThemeContext';
import { LightIcon, DarkIcon, AutoIcon } from './icons/ThemeIcons';

const ToggleContainer = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  background: var(--card-bg);
  padding: 8px;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  z-index: 100;
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

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <ToggleContainer>
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