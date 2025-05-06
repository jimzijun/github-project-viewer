export interface GitHubProject {
  name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  html_url: string;
  readme?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  issues: number;
  readme: string;
  full_name?: string;
  owner_login: string;
}

export interface ProjectContainerProps {
  currentProject: Project | null;
  onPrevious: () => void;
  onNext: () => void;
  allProjects?: Project[];
  currentIndex?: number;
}

export interface ReadmeContainerProps {
  readme: string;
  projectName: string;
  ownerLogin: string;
  toggleCardVisibility: () => void;
  isCardVisible: boolean;
  isLoading?: boolean;
} 