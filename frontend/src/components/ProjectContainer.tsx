import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import styled from '@emotion/styled';
import { ProjectContainerProps } from '../types';
import ReadmeContainer from './ReadmeContainer';
import { updateSquaresProps } from './Squares';
import { projectsApi } from '../services/api';
import { useTheme } from '../utils/ThemeContext';

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
  transform: translateX(${props => props.translateX}%);
  transition: ${props => props.freezeTransition ? 'none' : props.isDragging ? '0s' : '0.5s ease-in-out'};
  position: relative;
  z-index: 1;
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

// Add a styled component for the project counter
const ProjectCounter = styled.div`
  position: absolute;
  top: 10px;
  right: 15px;
  background: var(--card-bg);
  color: var(--text-color);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 80%;
  overflow: hidden;
  box-shadow: var(--card-shadow);
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
  const { effectiveTheme } = useTheme();
  const [isCardVisible, setIsCardVisible] = useState(true);
  const [showKeyboardHint, setShowKeyboardHint] = useState(true);
  const [translateX, setTranslateX] = useState(-33.333); // Start with current slide centered
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // We need to maintain prev, current, next projects
  const [prevProject, setPrevProject] = useState<any>(null);
  const [nextProject, setNextProject] = useState<any>(null);
  
  // State for READMEs
  const [currentReadme, setCurrentReadme] = useState<string>('');
  const [prevReadme, setPrevReadme] = useState<string>('');
  const [nextReadme, setNextReadme] = useState<string>('');
  
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
    
    console.log("Projects updated:", {
      prev: allProjects[prevIndex].name,
      current: currentProject.name,
      next: allProjects[nextIndex].name,
      prevIndex,
      currentIndex,
      nextIndex
    });
    
  }, [currentProject, currentIndex, allProjects]);
  
  // Fetch READMEs for current, previous, and next projects
  useEffect(() => {
    // Function to fetch a README for a project
    const fetchReadme = async (project: any, setReadme: React.Dispatch<React.SetStateAction<string>>) => {
      if (!project) return;
      
      try {
        // Only fetch if README is empty (not already fetched)
        if (!project.readme || project.readme === '') {
          const result = await projectsApi.getReadme(project.owner_login, project.name);
          // Store the README content in state
          setReadme(result.readme || `# ${project.name}\n\nNo README available.`);
          
          // Update the project object with the README content
          project.readme = result.readme || `# ${project.name}\n\nNo README available.`;
        } else {
          // If README is already loaded, set it from the project
          setReadme(project.readme);
        }
      } catch (error) {
        console.error(`Error fetching README for ${project.name}:`, error);
        setReadme(`# ${project.name}\n\nError fetching README content.`);
      }
    };
    
    // Fetch READMEs for current, previous, and next projects
    if (currentProject) {
      fetchReadme(currentProject, setCurrentReadme);
    }
    
    if (prevProject) {
      fetchReadme(prevProject, setPrevReadme);
    }
    
    if (nextProject) {
      fetchReadme(nextProject, setNextReadme);
    }
  }, [currentProject, prevProject, nextProject]);
  
  // Hide keyboard hint after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowKeyboardHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const navigateLeft = () => {
    if (isAnimating || !prevProject) return;
    
    // Start animation
    setIsAnimating(true);
    // Only update speed
    updateSquaresProps({ speed: 1.2 });
    
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
            // Reset speed only
            updateSquaresProps({ speed: 0.5 });
          }, 50);
        });
      });
    }, 500); // Wait for animation to complete
  };
  
  const navigateRight = () => {
    if (isAnimating || !nextProject) return;
    
    // Start animation
    setIsAnimating(true);
    // Only update speed
    updateSquaresProps({ speed: 1.2 });
    
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
            // Reset speed only
            updateSquaresProps({ speed: 0.5 });
          }, 50);
        });
      });
    }, 500); // Wait for animation to complete
  };
  
  // Add passive event listeners for better performance
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    const touchStartHandler = (e: TouchEvent) => {
      if (isAnimating) return;
      
      setTouchStart(e.targetTouches[0].clientX);
      setTouchEnd(null);
      setIsDragging(true);
      setDragAmount(0);
    };
    
    const touchMoveHandler = (e: TouchEvent) => {
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
    };
    
    const touchEndHandler = () => {
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
    };
    
    // Add event listeners with passive option for better performance
    element.addEventListener('touchstart', touchStartHandler as any, { passive: true });
    element.addEventListener('touchmove', touchMoveHandler as any, { passive: true });
    element.addEventListener('touchend', touchEndHandler as any, { passive: true });
    
    return () => {
      // Clean up event listeners
      element.removeEventListener('touchstart', touchStartHandler as any);
      element.removeEventListener('touchmove', touchMoveHandler as any);
      element.removeEventListener('touchend', touchEndHandler as any);
    };
  }, [touchStart, touchEnd, isAnimating, navigateLeft, navigateRight]);
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, prevProject, nextProject]);
  
  const toggleCardVisibility = () => {
    setIsCardVisible(!isCardVisible);
  };
  
  // Add to the ProjectContainer component for debugging
  useEffect(() => {
    console.log("Current translateX:", translateX);
    console.log("Current projects:", { 
      prev: prevProject?.name, 
      current: currentProject?.name, 
      next: nextProject?.name 
    });
  }, [translateX, prevProject, currentProject, nextProject]);
  
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
      {/* Project counter - simplified without dots */}
      <ProjectCounter>
        <span>Project {currentIndex + 1} of {allProjects.length}</span>
      </ProjectCounter>
      
      <SliderTrack 
        translateX={translateX + dragAmount} 
        isDragging={isDragging}
        freezeTransition={freezeTransition}
      >
        {/* Previous Slide */}
        <Slide data-slide="prev" key={`prev-${prevProject?.id || 'none'}`}>
          {prevProject ? (
            <ReadmeContainer 
              readme={prevReadme} 
              projectName={prevProject.name}
              toggleCardVisibility={toggleCardVisibility}
              isCardVisible={false}
            />
          ) : (
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              background: 'rgba(0,0,0,0.03)'
            }}>Loading previous project...</div>
          )}
        </Slide>
        
        {/* Current Slide */}
        <Slide data-slide="current" key={`current-${currentProject?.id || 'none'}`}>
          {currentProject ? (
            <ReadmeContainer 
              readme={currentReadme} 
              projectName={currentProject.name}
              toggleCardVisibility={toggleCardVisibility}
              isCardVisible={isCardVisible}
            />
          ) : (
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>No project selected</div>
          )}
        </Slide>
        
        {/* Next Slide */}
        <Slide data-slide="next" key={`next-${nextProject?.id || 'none'}`}>
          {nextProject ? (
            <ReadmeContainer 
              readme={nextReadme} 
              projectName={nextProject.name}
              toggleCardVisibility={toggleCardVisibility}
              isCardVisible={false}
            />
          ) : (
            <div style={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              background: 'rgba(0,0,0,0.03)'
            }}>Loading next project...</div>
          )}
        </Slide>
      </SliderTrack>
      
      {/* Swipe indicators */}
      {swipeDirection && swipeStrength > 0.1 && (
        <SwipeIndicator 
          direction={swipeDirection} 
          strength={swipeStrength}
        />
      )}
      
      {/* Debug info - only visible in development */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 1000, 
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        padding: '5px 10px',
        fontSize: '12px',
        borderRadius: '4px',
        pointerEvents: 'none',
        display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
      }}>
        <div>Prev: {prevProject?.name || 'None'} | <strong>Current: {currentProject?.name}</strong> | Next: {nextProject?.name || 'None'}</div>
        {isDragging && <div>Drag: {dragAmount.toFixed(2)}% | Swipe Strength: {swipeStrength.toFixed(2)}</div>}
      </div>
      
      {/* Make Card clickable */}
      <Card 
        isVisible={isCardVisible}
        onClick={toggleCardVisibility}
      >
        <ToggleIndicator>
          {isCardVisible ? '▼' : '▲'}
        </ToggleIndicator>
        <ProjectTitle>{currentProject.name}</ProjectTitle>
        <ProjectDescription>{currentProject.description}</ProjectDescription>
        <ProjectStats>
          <StatItem>
            <StatValue>{currentProject.stars}</StatValue>
            <StatLabel>Stars</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{currentProject.forks}</StatValue>
            <StatLabel>Forks</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{currentProject.issues}</StatValue>
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
      </Card>
      
      <KeyboardHint visible={showKeyboardHint}>
        <HintIcon>⌨️</HintIcon>
        Use arrow keys to navigate
      </KeyboardHint>
    </Container>
  );
};

export default ProjectContainer; 