export interface Project {
  id: string;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  topics: string[];
  owner_avatar_url: string;
  owner_login: string;
  stars: number;
  forks: number;
  issues: number;
  readme: string;
}

export interface ProjectCreate {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  topics: string[];
  owner_avatar_url: string;
  owner_login: string;
} 