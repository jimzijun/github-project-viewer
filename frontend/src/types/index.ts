export interface Project {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  issues: number;
  readme: string;
  created_at?: Date;
  updated_at?: Date;
} 