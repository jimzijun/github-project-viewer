import React, { useState, useEffect } from 'react';
import { Project } from './types/project';
import ProjectContainer from './components/ProjectContainer';
import { SingletonSquares, updateSquaresProps } from './components/Squares';
import { projectsApi } from './services/api';
import RepositoryFilters from './components/RepositoryFilters';
import LoadingSpinner from './components/LoadingSpinner';
import { useTheme } from './utils/ThemeContext';
import './App.css';

// Fallback sample data in case API fails
const sampleProjects: Project[] = [];

function App() {
  // Get theme information
  const { effectiveTheme } = useTheme();
  
  // State for projects and current index
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  
  // State for API filters
  const [language, setLanguage] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(true);
  
  // Fetch data from GitHub API
  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const repos = await projectsApi.getTrendingRepositories(language, timePeriod, 10);
      
      // Map API response to match expected structure with legacy fields
      const mappedRepos = repos.map(repo => ({
        ...repo,
        // Map stargazers_count to stars for compatibility
        stars: repo.stargazers_count || repo.stars || 0,
        // Map forks_count to forks for compatibility
        forks: repo.forks_count || repo.forks || 0,
        // Issues should already be provided by backend
        issues: repo.issues || 0,
        // Initialize readme as empty - will be fetched on demand
        readme: ''
      }));
      
      setProjects(mappedRepos);
      setBackendConnected(true);
      
      // Reset to first project when filters change
      setCurrentProjectIndex(0);
    } catch (error: any) {
      console.error('Failed to fetch repositories:', error);
      
      // Check if error is related to backend connection
      if (
        error.message.includes('Network error') || 
        error.message.includes('timed out') || 
        error.message.includes('Failed to fetch')
      ) {
        setBackendConnected(false);
        setError(
          'Unable to connect to the backend server. Please make sure it is running at http://localhost:8000 and try again.'
        );
      } else {
        setError(error.message || 'Failed to fetch GitHub repositories. Please try again later.');
      }
      
      // Use sample data as fallback
      if (projects.length === 0) {
        setProjects(sampleProjects);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch initial data
  useEffect(() => {
    fetchRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Re-fetch when filters change
  useEffect(() => {
    fetchRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, timePeriod]);
  
  // Update squares with theme-aware settings
  useEffect(() => {
    // Get CSS variables for squares
    const squaresBorder = getComputedStyle(document.documentElement).getPropertyValue('--squares-border').trim();
    const squaresBackground = getComputedStyle(document.documentElement).getPropertyValue('--squares-bg').trim();
    
    updateSquaresProps({
      speed: 0.5,
      squareSize: 40,
      borderColor: squaresBorder,
      squareBackground: squaresBackground,
      opacity: 0.5
    });
  }, []);
  
  const handlePrevious = () => {
    setCurrentProjectIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : projects.length - 1
    );
  };
  
  const handleNext = () => {
    setCurrentProjectIndex(prevIndex => 
      prevIndex < projects.length - 1 ? prevIndex + 1 : 0
    );
  };
  
  const handleRefresh = () => {
    fetchRepositories();
  };
  
  return (
    <div className="App">
      <SingletonSquares />
      
      {/* Repository filters */}
      <RepositoryFilters 
        language={language}
        setLanguage={setLanguage}
        timePeriod={timePeriod}
        setTimePeriod={setTimePeriod}
        refreshData={handleRefresh}
        isLoading={isLoading}
      />
      
      {/* Project container */}
      {projects.length > 0 && (
        <ProjectContainer 
          currentProject={projects[currentProjectIndex]}
          onPrevious={handlePrevious}
          onNext={handleNext}
          allProjects={projects}
          currentIndex={currentProjectIndex}
        />
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-container">
          <LoadingSpinner size={60} />
          <div className="loading-text">Loading GitHub repositories...</div>
        </div>
      )}
      
      {/* Error message */}
      {error && !isLoading && (
        <div className="error-container">
          <h2 className="error-title">Connection Error</h2>
          <p className="error-message">{error}</p>
          {!backendConnected && (
            <div className="backend-instructions">
              <p>To start the backend server:</p>
              <ol>
                <li>Open a terminal and navigate to the backend directory</li>
                <li>Activate the conda environment: <code>conda activate github-backend</code></li>
                <li>Run the server: <code>python run.py</code></li>
              </ol>
            </div>
          )}
          <button className="retry-button" onClick={handleRefresh}>Try Again</button>
        </div>
      )}
    </div>
  );
}

export default App;
