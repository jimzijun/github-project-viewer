import { Project, ProjectCreate } from '../types/project';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function for making API requests
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${await response.text()}`);
  }

  return await response.json();
}

// Projects API
export const projectsApi = {
  // Get all projects
  getProjects: async (skip = 0, limit = 100): Promise<Project[]> => {
    return fetchAPI<Project[]>(`/api/projects/?skip=${skip}&limit=${limit}`);
  },

  // Get a project by ID
  getProject: async (projectId: string): Promise<Project> => {
    return fetchAPI<Project>(`/api/projects/${projectId}`);
  },

  // Create a new project
  createProject: async (project: ProjectCreate): Promise<Project> => {
    return fetchAPI<Project>('/api/projects/', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  },

  // Update a project
  updateProject: async (projectId: string, project: ProjectCreate): Promise<Project> => {
    return fetchAPI<Project>(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(project)
    });
  },

  // Delete a project
  deleteProject: async (projectId: string): Promise<void> => {
    return fetchAPI<void>(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
  },

  // Search projects
  searchProjects: async (query: string, limit = 20): Promise<Project[]> => {
    return fetchAPI<Project[]>(`/api/search/?query=${encodeURIComponent(query)}&limit=${limit}`);
  },

  // Get trending repositories
  getTrendingRepositories: async (
    language: string = '',
    since: string = 'monthly',
    count: number = 10
  ): Promise<Project[]> => {
    return fetchAPI<Project[]>(
      `/api/trending/?language=${encodeURIComponent(language)}&since=${since}&count=${count}`
    );
  },
  
  // Get README content for a specific repository
  getReadme: async (owner: string, repo: string): Promise<{readme: string}> => {
    return fetchAPI<{readme: string}>(`/api/readme/${owner}/${repo}`);
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const result = await fetchAPI<{ status: string }>('/health');
    return result.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}; 