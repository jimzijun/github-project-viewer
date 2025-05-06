/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for the matchers
import App from './App';
import { projectsApi } from './services/api';

// Mock the API service
jest.mock('./services/api', () => ({
  projectsApi: {
    getTrendingRepositories: jest.fn(),
    clearCache: jest.fn()
  }
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock API to return a promise that doesn't resolve yet
    (projectsApi.getTrendingRepositories as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    render(<App />);
    
    // Check for loading indicator
    expect(screen.getByText(/Loading GitHub repositories/i)).toBeInTheDocument();
  });

  test('renders projects when API call succeeds', async () => {
    // Mock successful API response
    const mockProjects = [
      {
        id: '1',
        name: 'Test Repo',
        full_name: 'user/test-repo',
        description: 'A test repository',
        html_url: 'https://github.com/user/test-repo',
        stargazers_count: 100,
        forks_count: 50,
        language: 'TypeScript',
        created_at: '2023-01-01',
        updated_at: '2023-06-01',
        homepage: null,
        topics: ['test', 'demo'],
        owner_avatar_url: 'https://github.com/avatar.png',
        owner_login: 'user',
        stars: 100,
        forks: 50,
        issues: 10,
        readme: ''
      }
    ];
    
    (projectsApi.getTrendingRepositories as jest.Mock).mockResolvedValue(mockProjects);
    
    render(<App />);
    
    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Loading GitHub repositories/i)).not.toBeInTheDocument();
    });
    
    // Expect the project name to be rendered
    expect(screen.getByText('Test Repo')).toBeInTheDocument();
  });

  test('renders error message when API call fails', async () => {
    // Mock API failure
    (projectsApi.getTrendingRepositories as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch GitHub repositories')
    );
    
    render(<App />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch GitHub repositories/i)).toBeInTheDocument();
    });
    
    // Check for retry button
    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
  });
});
