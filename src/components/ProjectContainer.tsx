import React, { useState, useEffect, useRef, TouchEvent, useCallback } from 'react';
import styled from '@emotion/styled';
import { Project } from '../types/project';
import ReadmeContainer from './ReadmeContainer';
import { projectsApi } from '../services/api';
import ProjectSelector from './ProjectSelector';

// Define explicit ProjectContainerProps interface
export interface ProjectContainerProps {
  currentProject: Project;
  onPrevious: () => void;
  onNext: () => void;
  allProjects: Project[];
  currentIndex: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: transparent;
  touch-action: pan-y; /* Enable vertical scrolling but handle horizontal swipes */
`;

// Container for all 3 slides
const SliderTrack = styled.div<{ translateX: number; isDragging: boolean; freezeTransition: boolean }>`
  display: flex;
  width: 300%; /* 3x width for 3 slides */
  height: 100%;
  transform: translate3d(${props => props.translateX}%, 0, 0);
  transition: ${props => props.freezeTransition ? 'none' : props.isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'};
  position: relative;
  z-index: 1;
  will-change: transform;
`;

// Individual slide - exactly 1/3 width
const Slide = styled.div`
  width: 33.333%;
  height: 100%;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
  display: flex;
  background: transparent;
  /* Add a visual indicator for each slide */
  &[data-slide="prev"] {
    border-right: 2px dashed var(--border-color);
  }
  &[data-slide="current"] {
    border-right: 2px dashed var(--border-color);
  }
  &[data-slide="next"] {
    border-right: 2px dashed var(--border-color);
  }
`;

const Card = styled.div<{ isVisible: boolean }>`
  position: fixed;
  left: 5%;
  right: 5%;
  bottom: 20px; // Always at the same bottom position
  width: 90%;
  max-width: 600px;
  margin: 0 auto;
  min-height: 250px;
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--card-shadow);
  z-index: 10;
  transform: translateY(${props => props.isVisible ? '0' : 'calc(100% - 55px)'});
  transition: transform 0.3s ease-in-out;
  cursor: pointer;
  overflow: hidden;
`;

const ToggleIndicator = styled.div`
  position: absolute;
  top: 5px;
  right: 10px;
  color: var(--text-color);
  font-size: 16px;
`;

const ProjectTitle = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  text-align: center;
  color: var(--text-color);
`;

const ProjectDescription = styled.p`
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: var(--text-color);
  line-height: 1.5;
`;

const ProjectStats = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 5px;
`;

const StatLabel = styled.span`
  font-size: 0.8rem;
  color: var(--text-color);
  opacity: 0.7;
`;

const KeyboardHint = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: var(--card-bg);
  color: var(--text-color);
  border-radius: 20px;
  font-size: 0.9rem;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.5s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--card-shadow);
`;

const HintIcon = styled.span`
  font-size: 1rem;
  display: inline-block;
`;

const SwipeIndicator = styled.div<{ direction: 'left' | 'right' | null; strength: number }>`
  position: absolute;
  top: 50%;
  ${props => props.direction === 'left' ? 'right: 20px;' : 'left: 20px;'}
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.strength};
  pointer-events: none;
  z-index: 15;
  
  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-top: 2px solid var(--text-color);
    border-right: 2px solid var(--text-color);
    transform: rotate(${props => props.direction === 'left' ? '45deg' : '225deg'});
  }
`;

const GitHubButton = styled.a`
  display: flex;
  margin-top: 15px;
  background: var(--primary-color);
  color: var(--button-text);
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 14px;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s ease;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: var(--primary-hover);
  }
`;

const ProjectContainer: React.FC<ProjectContainerProps> = ({ 
  currentProject,
  onPrevious,
  onNext,
  allProjects = [],
  currentIndex = 0
}) => {
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [translateX, setTranslateX] = useState(-33.333); // Start with current slide centered
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // We need to maintain prev, current, next projects
  const [prevProject, setPrevProject] = useState<Project | null>(null);
  const [nextProject, setNextProject] = useState<Project | null>(null);
  
  // State for READMEs
  const [currentReadme, setCurrentReadme] = useState<string>('');
  const [prevReadme, setPrevReadme] = useState<string>('');
  const [nextReadme, setNextReadme] = useState<string>('');
  
  // Loading states for READMEs
  const [isCurrentReadmeLoading, setIsCurrentReadmeLoading] = useState(false);
  const [isPrevReadmeLoading, setIsPrevReadmeLoading] = useState(false);
  const [isNextReadmeLoading, setIsNextReadmeLoading] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragAmount, setDragAmount] = useState(0);
  const [swipeStrength, setSwipeStrength] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  // Reference to the container element for adding passive event listeners
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [freezeTransition, setFreezeTransition] = useState(false);
  
  // Get previous and next projects from the allProjects array
  useEffect(() => {
    if (!currentProject || allProjects.length === 0) return;
    
    // Calculate previous and next indices properly
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allProjects.length - 1;
    const nextIndex = currentIndex < allProjects.length - 1 ? currentIndex + 1 : 0;
    
    // Set previous and next projects
    setPrevProject(allProjects[prevIndex]);
    setNextProject(allProjects[nextIndex]);
  }, [currentProject, currentIndex, allProjects]);
  
  // Replace README loading logic with optimized version
  const fetchAndSetReadme = useCallback(async (
    project: Project, 
    setReadmeFunc: React.Dispatch<React.SetStateAction<string>>,
    setLoadingFunc: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (!project) return;
    
    // Check if README is already available
    if (project.readme) {
      setReadmeFunc(project.readme);
      return;
    }
    
    try {
      setLoadingFunc(true);
      const { readme } = await projectsApi.getReadme(project.owner_login, project.name);
      
      // Cache the README in the project object to avoid refetching
      project.readme = readme;
      setReadmeFunc(readme);
    } catch (error) {
      console.error(`Failed to fetch README for ${project.name}:`, error);
      setReadmeFunc('*No README found for this project.*');
    } finally {
      setLoadingFunc(false);
    }
  }, []);
  
  // Optimize when to fetch READMEs - prioritize current, then load prev/next in sequence
  useEffect(() => {
    if (!currentProject) return;
    
    // Always fetch current README immediately
    fetchAndSetReadme(currentProject, setCurrentReadme, setIsCurrentReadmeLoading);
    
    // Create an AbortController for cleanup
    const controller = new AbortController();
    
    // Use setTimeout to defer loading previous and next READMEs
    const timeoutId = setTimeout(() => {
      if (controller.signal.aborted) return;
      
      // Load previous README with a small delay
      if (prevProject) {
        fetchAndSetReadme(prevProject, setPrevReadme, setIsPrevReadmeLoading);
      }
      
      // Load next README with a further delay
      const nextTimeoutId = setTimeout(() => {
        if (controller.signal.aborted) return;
        if (nextProject) {
          fetchAndSetReadme(nextProject, setNextReadme, setIsNextReadmeLoading);
        }
      }, 500); // Delay next README loading by an additional 500ms
      
      return () => clearTimeout(nextTimeoutId);
    }, 200); // Initial delay of 200ms for prev README
    
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [currentProject, prevProject, nextProject, fetchAndSetReadme]);
  
  // Hide keyboard hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowKeyboardHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const navigateLeft = useCallback(() => {
    if (isAnimating || !prevProject) return;
    
    // Start animation
    setIsAnimating(true);
    
    // Move track to show previous slide
    setTranslateX(0); // Show left slide
    
    // After animation completes
    setTimeout(() => {
      onPrevious(); // Update current project
      
      // Reset track position without animation
      // First freeze the transition
      setFreezeTransition(true);
      
      // Use requestAnimationFrame to ensure the DOM has processed the freeze
      requestAnimationFrame(() => {
        // In the next frame, reset the position
        setTranslateX(-33.333); // Reset to center
        
        // Use another rAF to ensure the position reset is processed
        requestAnimationFrame(() => {
          // Then unfreeze transitions for future animations
          setTimeout(() => {
            setFreezeTransition(false);
            setIsAnimating(false);
          }, 50);
        });
      });
    }, 500); // Wait for animation to complete
  }, [isAnimating, prevProject, onPrevious]);
  
  const navigateRight = useCallback(() => {
    if (isAnimating || !nextProject) return;
    
    // Start animation
    setIsAnimating(true);
    
    // Move track to show next slide
    setTranslateX(-66.666); // Show right slide
    
    // After animation completes
    setTimeout(() => {
      onNext(); // Update current project
      
      // Reset track position without animation
      // First freeze the transition
      setFreezeTransition(true);
      
      // Use requestAnimationFrame to ensure the DOM has processed the freeze
      requestAnimationFrame(() => {
        // In the next frame, reset the position
        setTranslateX(-33.333); // Reset to center
        
        // Use another rAF to ensure the position reset is processed
        requestAnimationFrame(() => {
          // Then unfreeze transitions for future animations
          setTimeout(() => {
            setFreezeTransition(false);
            setIsAnimating(false);
          }, 50);
        });
      });
    }, 500); // Wait for animation to complete
  }, [isAnimating, nextProject, onNext]);
  
  // Touch handlers with useCallback for better performance
  const touchStartHandler = useCallback((e: TouchEvent) => {
    if (isAnimating) return;
    
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
    setIsDragging(true);
    setDragAmount(0);
  }, [isAnimating]);
  
  const touchMoveHandler = useCallback((e: TouchEvent) => {
    if (!touchStart || isAnimating) return;
    
    const currentPosition = e.targetTouches[0].clientX;
    setTouchEnd(currentPosition);
    
    // Calculate how far the user has dragged
    const dragDistance = touchStart - currentPosition;
    const dragPercent = (dragDistance / window.innerWidth) * 100;
    
    // Limit drag amount and apply resistance as you drag further
    const maxDrag = 15; // Maximum percentage to drag
    const resistance = 0.5; // Reduce movement as user drags further
    
    let limitedDragPercent = 0;
    if (Math.abs(dragPercent) <= maxDrag) {
      limitedDragPercent = dragPercent;
    } else {
      const overDrag = Math.abs(dragPercent) - maxDrag;
      const resistedOverDrag = overDrag * resistance;
      limitedDragPercent = (dragPercent < 0 ? -1 : 1) * (maxDrag + resistedOverDrag);
    }
    
    setDragAmount(limitedDragPercent);
    
    // Update the slider position directly based on drag
    const basePosition = -33.333; // Center position
    setTranslateX(basePosition - limitedDragPercent);
    
    // Calculate swipe strength (0 to 1) for visual indicator
    const normalizedStrength = Math.min(Math.abs(dragPercent) / 20, 1);
    setSwipeStrength(normalizedStrength);
    setSwipeDirection(dragPercent > 0 ? 'left' : 'right');
  }, [touchStart, isAnimating]);
  
  const touchEndHandler = useCallback(() => {
    if (!touchStart || !touchEnd || isAnimating) return;
    
    setIsDragging(false);
    
    // Calculate swipe distance
    const distance = touchStart - touchEnd;
    const isSignificantSwipe = Math.abs(distance) > 50; // Minimum swipe distance in pixels
    
    // If drag amount is significant, navigate
    if (isSignificantSwipe) {
      if (distance > 0) {
        // Swiped left -> go to next project
        navigateRight();
      } else {
        // Swiped right -> go to previous project
        navigateLeft();
      }
    } else {
      // Not a significant swipe, reset position
      setTranslateX(-33.333);
    }
    
    // Reset touch positions and visual indicators
    setTouchStart(null);
    setTouchEnd(null);
    setDragAmount(0);
    setSwipeStrength(0);
    setSwipeDirection(null);
  }, [touchStart, touchEnd, isAnimating, navigateLeft, navigateRight]);
  
  // Add passive event listeners for better performance
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    // Add event listeners with passive option for better performance
    element.addEventListener('touchstart', touchStartHandler as unknown as EventListener, { passive: true });
    element.addEventListener('touchmove', touchMoveHandler as unknown as EventListener, { passive: true });
    element.addEventListener('touchend', touchEndHandler as unknown as EventListener, { passive: true });
    
    return () => {
      // Clean up event listeners
      element.removeEventListener('touchstart', touchStartHandler as unknown as EventListener);
      element.removeEventListener('touchmove', touchMoveHandler as unknown as EventListener);
      element.removeEventListener('touchend', touchEndHandler as unknown as EventListener);
    };
  }, [touchStartHandler, touchMoveHandler, touchEndHandler]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateLeft();
      } else if (e.key === 'ArrowRight') {
        navigateRight();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateLeft, navigateRight]);
  
  const toggleCardVisibility = () => {
    setIsCardVisible(!isCardVisible);
  };

  // Round a number to a readable format (e.g. 1.2k)
  const formatNumber = (num: number) => {
    if (num > 999999) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num > 999) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return num.toString();
    }
  };
  
  // Add a new function to handle direct project selection
  const handleSelectProject = useCallback((index: number) => {
    // Don't do anything if selecting the current project
    if (index === currentIndex) return;
    
    // Calculate the difference between current and selected
    const diff = index - currentIndex;
    
    // Use a more efficient approach to navigate multiple steps
    if (diff < 0) {
      // Navigate backwards
      const stepsToNavigate = Math.abs(diff);
      for (let i = 0; i < stepsToNavigate; i++) {
        setTimeout(() => onPrevious(), i * 50);
      }
    } else {
      // Navigate forwards
      for (let i = 0; i < diff; i++) {
        setTimeout(() => onNext(), i * 50);
      }
    }
  }, [currentIndex, onNext, onPrevious]);
  
  if (!currentProject) {
    return <div>No project selected</div>;
  }
  
  if (!prevProject || !nextProject) {
    return <div>Loading projects...</div>;
  }
  
  return (
    <Container 
      ref={containerRef}
    >
      {/* Project Selector */}
      <div style={{ 
        position: 'absolute', 
        top: '0', 
        right: '0', 
        zIndex: 50 
      }}>
        <ProjectSelector
          currentIndex={currentIndex}
          allProjects={allProjects}
          onSelectProject={handleSelectProject}
        />
      </div>
      
      <SliderTrack 
        translateX={translateX + dragAmount} 
        isDragging={isDragging}
        freezeTransition={freezeTransition}
      >
        {/* Previous Slide */}
        <Slide data-slide="prev" key="prev-slide">
          <ReadmeContainer 
            readme={prevReadme} 
            projectName={prevProject.name}
            ownerLogin={prevProject.owner_login}
            toggleCardVisibility={toggleCardVisibility}
            isCardVisible={false}
            isLoading={isPrevReadmeLoading}
          />
        </Slide>
        
        {/* Current Slide */}
        <Slide data-slide="current" key="current-slide">
          <ReadmeContainer 
            readme={currentReadme} 
            projectName={currentProject.name}
            ownerLogin={currentProject.owner_login}
            toggleCardVisibility={toggleCardVisibility}
            isCardVisible={isCardVisible}
            isLoading={isCurrentReadmeLoading}
          />
        </Slide>
        
        {/* Next Slide */}
        <Slide data-slide="next" key="next-slide">
          <ReadmeContainer 
            readme={nextReadme} 
            projectName={nextProject.name}
            ownerLogin={nextProject.owner_login}
            toggleCardVisibility={toggleCardVisibility}
            isCardVisible={false}
            isLoading={isNextReadmeLoading}
          />
        </Slide>
      </SliderTrack>
      
      {/* Swipe indicators */}
      {swipeDirection && swipeStrength > 0.1 && (
        <SwipeIndicator 
          direction={swipeDirection} 
          strength={swipeStrength}
        />
      )}

      
      {/* Project info card */}
      <Card isVisible={isCardVisible} onClick={toggleCardVisibility}>
        <ToggleIndicator>
          {isCardVisible ? '▼' : '▲'}
        </ToggleIndicator>
        
        {currentProject && (
          <>
            <ProjectTitle>{currentProject.name}</ProjectTitle>
            <ProjectDescription>{currentProject.description || 'No description available'}</ProjectDescription>
            
            <ProjectStats>
              <StatItem>
                <StatValue>⭐ {formatNumber(currentProject.stars)}</StatValue>
                <StatLabel>Stars</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>🍴 {formatNumber(currentProject.forks)}</StatValue>
                <StatLabel>Forks</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>🔍 {formatNumber(currentProject.issues)}</StatValue>
                <StatLabel>Issues</StatLabel>
              </StatItem>
            </ProjectStats>
            
            <GitHubButton 
              href={`https://github.com/${currentProject.full_name}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View {currentProject.name} on GitHub
            </GitHubButton>
          </>
        )}
      </Card>
      
      <KeyboardHint visible={showKeyboardHint}>
        <HintIcon>⌨️</HintIcon>
        Use arrow keys to navigate
      </KeyboardHint>
    </Container>
  );
};

export default React.memo(ProjectContainer); 