import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { Project } from '../types/project';

interface ProjectSelectorProps {
  currentIndex: number;
  allProjects: Project[];
  onSelectProject: (index: number) => void;
}

const ProjectCounterContainer = styled.div`
  position: relative;
  background: var(--card-bg);
  color: var(--text-color);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: visible;
  box-shadow: var(--card-shadow);
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 10px 15px;
  
  &:hover {
    background: var(--card-hover-bg, rgba(255, 255, 255, 0.15));
  }
`;

const DropdownArrow = styled.span`
  margin-left: 6px;
  font-size: 10px;
  transition: transform 0.3s ease;
  display: inline-block;
  transform: rotate(0deg);
  
  &.open {
    transform: rotate(180deg);
  }
`;

// Right side navigation sidebar
const SidebarNav = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-300px'};
  width: 280px;
  height: 100vh;
  background: var(--card-bg, rgba(30, 30, 30, 0.95));
  z-index: 100;
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease-in-out;
  box-shadow: ${props => props.isOpen ? 'var(--sidebar-shadow, -5px 0 15px rgba(0, 0, 0, 0.3))' : 'none'};
  overflow-y: auto;
  padding: 60px 15px 20px;
`;

// Semi-transparent overlay
const NavOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  backdrop-filter: blur(2px);
`;

const NavTitle = styled.h2`
  color: var(--text-color);
  font-size: 18px;
  text-align: center;
  margin: 0 0 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
`;

const NavCard = styled.div<{ isActive: boolean }>`
  background: ${props => props.isActive ? 
    'var(--active-card-bg, rgba(60, 60, 60, 0.8))' : 
    'var(--card-bg, rgba(40, 40, 40, 0.4))'};
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: ${props => props.isActive ? 
    '4px solid var(--primary-color, #6200ee)' : 
    '4px solid transparent'};
  box-shadow: ${props => props.isActive ? 
    'var(--active-card-shadow, 0 2px 8px rgba(0, 0, 0, 0.2))' : 
    'none'};
  display: flex;
  flex-direction: column;
  position: relative;
  
  &:hover {
    background: ${props => !props.isActive ? 
      'var(--card-hover-bg, rgba(50, 50, 50, 0.6))' : 
      'var(--active-card-bg, rgba(60, 60, 60, 0.8))'};
    transform: translateX(${props => props.isActive ? '0' : '-5px'});
  }
`;

const NavCardIndex = styled.div`
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  background: var(--primary-color, #6200ee);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
`;

const NavCardTitle = styled.h3`
  margin: 0 0 5px;
  font-size: 14px;
  color: var(--text-color);
  padding-right: 30px; /* Space for the index number */
`;

const NavCardDescription = styled.p`
  margin: 0;
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const NavCardStats = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-color);
  opacity: 0.8;
`;

const NavStatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  color: var(--text-color);
  font-size: 18px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ 
  currentIndex,
  allProjects,
  onSelectProject
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  
  // Toggle the navigation sidebar using useCallback
  const toggleNav = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNavOpen(prev => !prev);
  }, []);
  
  // Handle project selection using useCallback
  const handleSelectProject = useCallback((index: number) => {
    onSelectProject(index);
    // Don't close the nav so users can easily navigate between projects
  }, [onSelectProject]);
  
  // Close nav when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        navRef.current && 
        !navRef.current.contains(event.target as Node) &&
        containerRef.current && 
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsNavOpen(false);
      }
    };
    
    if (isNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNavOpen]);
  
  // Format numbers (e.g. 1000 -> 1k)
  const formatNumber = useCallback((num: number) => {
    if (num > 999999) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num > 999) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return num.toString();
    }
  }, []);
  
  // Handle escape key to close nav
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNavOpen) {
        setIsNavOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isNavOpen]);
  
  return (
    <>
      <ProjectCounterContainer ref={containerRef} onClick={toggleNav}>
        <span>Project {currentIndex + 1} of {allProjects.length}</span>
        <DropdownArrow className={isNavOpen ? 'open' : ''}>▼</DropdownArrow>
      </ProjectCounterContainer>
      
      <NavOverlay isOpen={isNavOpen} onClick={() => setIsNavOpen(false)} />
      
      <SidebarNav isOpen={isNavOpen} ref={navRef}>
        <CloseButton onClick={() => setIsNavOpen(false)}>×</CloseButton>
        <NavTitle>Projects</NavTitle>
        
        {allProjects.map((project, index) => (
          <NavCard 
            key={project.id} 
            isActive={index === currentIndex}
            onClick={() => handleSelectProject(index)}
          >
            <NavCardTitle>{project.name}</NavCardTitle>
            <NavCardDescription>
              {project.description || 'No description available'}
            </NavCardDescription>
            
            <NavCardStats>
              <NavStatItem>⭐ {formatNumber(project.stars)}</NavStatItem>
              <NavStatItem>🍴 {formatNumber(project.forks)}</NavStatItem>
            </NavCardStats>
            
            <NavCardIndex>{index + 1}</NavCardIndex>
          </NavCard>
        ))}
      </SidebarNav>
    </>
  );
};

export default ProjectSelector; 