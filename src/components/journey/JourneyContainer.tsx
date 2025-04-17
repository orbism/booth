// src/components/journey/JourneyContainer.tsx
"use client";
import React, { useState, useEffect, useRef } from 'react';
import JourneyPageView from './JourneyPageView';
import { JourneyPage } from '@/types/journey';
import { trackJourneyPageView, trackJourneyComplete } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);
      // Track journey completion
      const timeSpent = Date.now() - startTimeRef.current;
      trackJourneyComplete(analyticsId, pages.length, timeSpent)
        .finally(() => {
          setIsLoading(false);
          // Last page, complete the journey
          onComplete();
        });
      return;
    }
    
    // Set direction for animation
    setTransitionDirection('left');
    setCurrentPageIndex(prev => prev + 1);
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setTransitionDirection('right');
      setCurrentPageIndex(prev => prev - 1);
    }
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

  // Animation variants for page transitions
  const pageVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -300 : 300,
      opacity: 0
    })
  };
  
  return (
    <div className="relative overflow-hidden">
      <AnimatePresence initial={false} custom={transitionDirection} mode="wait">
        <motion.div
          key={currentPageIndex}
          custom={transitionDirection}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.5 }}
          className="w-full"
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
            onPrevious={currentPageIndex > 0 ? handlePrevious : undefined}
            isLoading={isLoading}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Page indicator dots */}
      {pages.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {pages.map((_, index) => (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentPageIndex 
                  ? 'bg-blue-600 w-4' 
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