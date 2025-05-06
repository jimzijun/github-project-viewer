import React from 'react';
import styled from '@emotion/styled';
import LoadingSpinner from './LoadingSpinner';
import ThemeToggle from './ThemeToggle';

interface RepositoryFiltersProps {
  language: string;
  setLanguage: (language: string) => void;
  timePeriod: 'daily' | 'weekly' | 'monthly';
  setTimePeriod: (period: 'daily' | 'weekly' | 'monthly') => void;
  refreshData: () => void;
  isLoading: boolean;
}

const FiltersContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 20px;
  background: var(--card-bg);
  padding: 15px;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  z-index: 100;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 250px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
`;

const Select = styled.select`
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--focus-color);
  }
`;

const Button = styled.button<{ isLoading?: boolean }>`
  padding: 8px 12px;
  background: ${props => props.isLoading ? '#ccc' : 'var(--primary-color)'};
  color: var(--button-text);
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.3s ease;
  
  &:hover {
    background: ${props => props.isLoading ? '#ccc' : 'var(--primary-hover)'};
  }
`;

// Common programming languages
const popularLanguages = [
  '',
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'c++',
  'c#',
  'go',
  'rust',
  'ruby',
  'swift',
  'kotlin',
  'php'
];

const RepositoryFilters: React.FC<RepositoryFiltersProps> = ({
  language,
  setLanguage,
  timePeriod,
  setTimePeriod,
  refreshData,
  isLoading
}) => {
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };
  
  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(e.target.value as 'daily' | 'weekly' | 'monthly');
  };
  
  return (
    <FiltersContainer>
      <FilterGroup>
        <Label>Programming Language</Label>
        <Select value={language} onChange={handleLanguageChange}>
          <option value="">All Languages</option>
          {popularLanguages.filter(lang => lang !== '').map(lang => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </Select>
      </FilterGroup>
      
      <FilterGroup>
        <Label>Time Period</Label>
        <Select value={timePeriod} onChange={handleTimePeriodChange}>
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </Select>
      </FilterGroup>
      
      <ThemeToggle />
      
      <Button onClick={refreshData} isLoading={isLoading} disabled={isLoading}>
        {isLoading ? (
          <>
            <LoadingSpinner size={16} />
            Loading...
          </>
        ) : 'Refresh Data'}
      </Button>
    </FiltersContainer>
  );
};

export default RepositoryFilters; 