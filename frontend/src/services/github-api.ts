import { Project } from '../types/project';
import { projectsApi } from './api';

// Cache duration in milliseconds (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// Interface for cache entries
interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

// Local storage cache implementation for client-side caching
class LocalStorageCache {
  private prefix: string;

  constructor(prefix: string = 'github_cache_') {
    this.prefix = prefix;
  }

  get<T>(key: string): T | null {
    const item = localStorage.getItem(this.prefix + key);
    if (!item) return null;

    try {
      const cacheEntry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cacheEntry.timestamp > CACHE_DURATION) {
        this.delete(key);
        return null;
      }
      
      return cacheEntry.data;
    } catch (e) {
      console.error('Cache parse error:', e);
      return null;
    }
  }

  set<T>(key: string, data: T): void {
    const cacheEntry: CacheEntry<T> = {
      timestamp: Date.now(),
      data
    };
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(cacheEntry));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

// Create singleton cache instance
const cache = new LocalStorageCache();

/**
 * GitHub API service that communicates with the backend
 */
export class GitHubApiService {
  private cache = cache;
  
  /**
   * Fetch trending repositories from the backend API
   */
  async getTrendingRepositories(
    language: string = '', 
    since: 'daily' | 'weekly' | 'monthly' = 'weekly', 
    count: number = 10
  ): Promise<Project[]> {
    const cacheKey = `trending_${language}_${since}_${count}`;
    
    // Check browser cache first for fastest response
    const cachedData = this.cache.get<Project[]>(cacheKey);
    if (cachedData) {
      console.log('Using cached data for trending repos');
      return cachedData;
    }
    
    try {
      // Fetch from backend API
      console.log('Fetching from backend API');
      const projects = await projectsApi.getTrendingRepositories(language, since, count);
      
      // Update cache
      this.cache.set(cacheKey, projects);
      
      return projects;
    } catch (error) {
      console.error('Error fetching trending repositories:', error);
      throw error;
    }
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const githubApi = new GitHubApiService(); 