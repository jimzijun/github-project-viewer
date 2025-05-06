import React, { useState, useEffect, useCallback } from 'react';
import { Project } from './types/project';
import ProjectContainer from './components/ProjectContainer';
import { projectsApi } from './services/api';
import RepositoryFilters from './components/RepositoryFilters';
import LoadingSpinner from './components/LoadingSpinner';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

// Fallback sample data in case API fails
const sampleProjects: Project[] = [];

// Helper to create default date (1 month ago)
const getDefaultDate = (): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
};

const App: React.FC = () => {
  // State for projects and current index
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  
  // State for API filters
  const [language, setLanguage] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<Date>(getDefaultDate());
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(true);
  
  // Fetch data from GitHub API (memoized with useCallback)
  const fetchRepositories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    // Use AbortController for cleanup
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      const repos = await projectsApi.getTrendingRepositories(language, timePeriod, 10);
      
      // Check if the component is still mounted (signal not aborted)
      if (!signal.aborted) {
        setProjects(repos);
        setBackendConnected(true);
        
        // Reset to first project when filters change
        setCurrentProjectIndex(0);
      }
    } catch (error: any) {
      // Only process error if not from aborting
      if (!signal.aborted) {
        console.error('Failed to fetch repositories:', error);
        
        // Check if error is related to backend connection
        if (
          error.message.includes('Network error') || 
          error.message.includes('timed out') || 
          error.message.includes('Failed to fetch')
        ) {
          setBackendConnected(false);
          setError(
            'Unable to connect to the GitHub API. Please check your internet connection and try again.'
          );
        } else {
          setError(error.message || 'Failed to fetch GitHub repositories. Please try again later.');
        }
        
        // Use sample data as fallback
        if (projects.length === 0) {
          setProjects(sampleProjects);
        }
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
    
    // Return cleanup function
    return () => {
      controller.abort();
    };
  }, [language, timePeriod, projects.length]);
  
  // Fetch initial data
  useEffect(() => {
    const fetchOperation = fetchRepositories();
    return () => {
      // Cleanup function will be called from fetchRepositories
      fetchOperation.then(cleanup => cleanup && cleanup());
    };
  }, [fetchRepositories]);
  
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
    projectsApi.clearCache(); // Clear cache before refreshing
    fetchRepositories();
  };
  
  return (
    <div className="App">
      {/* Repository filters */}
      <RepositoryFilters 
        language={language}
        setLanguage={setLanguage}
        timePeriod={timePeriod}
        setTimePeriod={setTimePeriod}
        refreshData={handleRefresh}
        isLoading={isLoading}
      />
      
      {/* Theme toggle */}
      <ThemeToggle />
      
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
              <p>Possible solutions:</p>
              <ol>
                <li>Check your internet connection</li>
                <li>GitHub API may be experiencing issues</li>
                <li>You may have exceeded the GitHub API rate limit (60 requests per hour for unauthenticated users)</li>
                <li>Add a GitHub token in your .env file as REACT_APP_GITHUB_TOKEN for more requests</li>
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
