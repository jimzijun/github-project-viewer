import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type ThemeType = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get theme from localStorage or default to 'auto'
  const [theme, setTheme] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as ThemeType) || 'auto';
  });
  
  // State to track the effective theme (either light or dark)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');
  
  // Function to determine if the system prefers dark mode
  const prefersDarkMode = () => 
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Update theme in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Apply the appropriate theme based on selection
    if (theme === 'auto') {
      setEffectiveTheme(prefersDarkMode() ? 'dark' : 'light');
    } else {
      setEffectiveTheme(theme);
    }
    
    // Apply theme class to body element
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${effectiveTheme}-theme`);
  }, [theme, effectiveTheme]);
  
  // Listen for changes in system theme
  useEffect(() => {
    if (theme !== 'auto') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      setEffectiveTheme(prefersDarkMode() ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 