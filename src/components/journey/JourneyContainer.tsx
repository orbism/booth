// src/components/journey/JourneyContainer.tsx (updated with analytics)
import React, { useState, useEffect, useRef } from 'react';
import JourneyPageView from './JourneyPageView';
import { JourneyPage } from '@/types/journey';
import { trackJourneyPageView, trackJourneyComplete } from '@/lib/analytics';

interface JourneyContainerProps {
  pages: JourneyPage[];
  primaryColor: string;
  buttonColor: string;
  onComplete: () => void;
  analyticsId: string | null;
}

const JourneyContainer: React.FC<JourneyContainerProps> = ({
  pages,
  primaryColor,
  buttonColor,
  onComplete,
  analyticsId,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  
  // Track initial page view
  useEffect(() => {
    if (pages.length > 0 && analyticsId) {
      const currentPage = pages[currentPageIndex];
      trackJourneyPageView(
        analyticsId,
        currentPage.id,
        currentPageIndex,
        currentPage.title
      );
    }
    // Reset start time when journey begins
    startTimeRef.current = Date.now();
  }, [analyticsId, currentPageIndex, pages]);
  
  const handleNext = () => {
    if (currentPageIndex === pages.length - 1) {
      // Track journey completion
      const timeSpent = Date.now() - startTimeRef.current;
      trackJourneyComplete(analyticsId, pages.length, timeSpent);
      
      // Last page, complete the journey
      onComplete();
      return;
    }
    
    // Animate transition
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPageIndex(prev => prev + 1);
      setIsTransitioning(false);
    }, 300);
  };
  
  // If there are no pages, immediately complete
  useEffect(() => {
    if (pages.length === 0) {
      onComplete();
    }
  }, [pages, onComplete]);
  
  if (pages.length === 0) {
    return null;
  }
  
  const currentPage = pages[currentPageIndex];
  
  return (
    <div 
      className={`transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <JourneyPageView
        title={currentPage.title}
        content={currentPage.content}
        backgroundImage={currentPage.backgroundImage}
        buttonText={currentPage.buttonText}
        buttonImage={currentPage.buttonImage}
        primaryColor={primaryColor}
        buttonColor={buttonColor}
        onNext={handleNext}
      />
      
      {/* Page indicator dots */}
      {pages.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {pages.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full ${
                index === currentPageIndex 
                  ? 'bg-blue-600' 
                  : 'bg-gray-300'
              }`}
              style={{
                backgroundColor: index === currentPageIndex ? primaryColor : undefined
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JourneyContainer;