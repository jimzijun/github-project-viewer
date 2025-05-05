import { Project, ProjectCreate } from '../types/project';
import { projectsApi } from './api';

/**
 * Project model for frontend operations
 */
export class ProjectModel {
  /**
   * Get all projects
   */
  static async getAllProjects(limit: number = 50): Promise<Project[]> {
    try {
      return await projectsApi.getProjects(0, limit);
    } catch (error) {
      console.error('Error getting all projects:', error);
      throw error;
    }
  }
  
  /**
   * Get a single project by ID
   */
  static async getProjectById(id: string): Promise<Project | null> {
    try {
      return await projectsApi.getProject(id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      console.error(`Error getting project with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Search projects by name or description
   */
  static async searchProjects(query: string, limit: number = 20): Promise<Project[]> {
    try {
      return await projectsApi.searchProjects(query, limit);
    } catch (error) {
      console.error(`Error searching projects with query "${query}":`, error);
      throw error;
    }
  }
  
  /**
   * Create or update a project
   */
  static async saveProject(project: Project | ProjectCreate): Promise<Project> {
    try {
      if ('id' in project && project.id) {
        const { id, ...projectData } = project as Project;
        return await projectsApi.updateProject(id, projectData);
      } else {
        return await projectsApi.createProject(project as ProjectCreate);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }
  
  /**
   * Delete a project by ID
   */
  static async deleteProject(id: string): Promise<boolean> {
    try {
      await projectsApi.deleteProject(id);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      console.error(`Error deleting project with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get trending repositories
   */
  static async getTrendingRepositories(
    language: string = '',
    since: string = 'weekly',
    count: number = 10
  ): Promise<Project[]> {
    try {
      return await projectsApi.getTrendingRepositories(language, since, count);
    } catch (error) {
      console.error('Error getting trending repositories:', error);
      throw error;
    }
  }
} 