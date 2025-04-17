// src/components/journey/JourneyPreview.tsx
import React, { useState } from 'react';
import { JourneyPage } from '@/types/journey';
import JourneyPageView from './JourneyPageView';
import PreviewDeviceFrame from './PreviewDeviceFrame';
import { getContrastTextColor } from '@/utils/theme-utils';
import { motion, AnimatePresence } from 'framer-motion';

interface JourneyPreviewProps {
  pages: JourneyPage[];
  primaryColor: string;
  buttonColor: string;
  backgroundColor: string;
  isVisible: boolean;
}

const JourneyPreview: React.FC<JourneyPreviewProps> = ({
  pages,
  primaryColor,
  buttonColor,
  backgroundColor,
  isVisible
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-lg border border-gray-300">
        <p className="text-gray-500">No journey pages to preview</p>
      </div>
    );
  }
  
  const currentPage = pages[currentPageIndex];

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setTransitionDirection('left');
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setTransitionDirection('right');
      setCurrentPageIndex(prev => prev - 1);
    }
  };

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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Preview header */}
        <div className="flex justify-between items-center bg-gray-100 p-4 border-b">
          <h3 className="text-lg font-semibold">Journey Preview</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Page {currentPageIndex + 1} of {pages.length}
            </span>
            <button 
              onClick={() => setCurrentPageIndex(0)}
              className="p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Reset
            </button>
            <button
              className="p-2 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded"
              onClick={() => document.dispatchEvent(new CustomEvent('closeJourneyPreview'))}
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Device controls */}
        <div className="px-4 pt-4 flex justify-center space-x-4">
            <button
                onClick={() => setDeviceType('mobile')}
                className={`px-3 py-1 rounded ${
                deviceType === 'mobile' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
            >
            Mobile
        </button>
            <button
                onClick={() => setDeviceType('tablet')}
                className={`px-3 py-1 rounded ${
                deviceType === 'tablet' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
            >
            Tablet
        </button>
            <button
                onClick={() => setDeviceType('desktop')}
                className={`px-3 py-1 rounded ${
                deviceType === 'desktop' 
                    ? 'bg-blue-100 text-blue-800 font-medium' 
                    : 'bg-gray-100 text-gray-700'
                }`}
            >
            Desktop
        </button>
        </div>

        {/* Device preview */}
        <PreviewDeviceFrame device={deviceType} backgroundColor={backgroundColor}>
        <AnimatePresence initial={false} custom={transitionDirection} mode="wait">
            <motion.div
                key={currentPageIndex}
                custom={transitionDirection}
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', duration: 0.5 }}
                className="w-full h-full"
            >
            <JourneyPageView
                title={currentPage.title}
                content={currentPage.content}
                backgroundImage={currentPage.backgroundImage}
                buttonText={currentPage.buttonText}
                buttonImage={currentPage.buttonImage}
                primaryColor={primaryColor}
                buttonColor={buttonColor}
                onNext={goToNextPage}
                onPrevious={currentPageIndex > 0 ? goToPreviousPage : undefined}
                isPreview={true}
                previewMode={deviceType}
            />
            </motion.div>
        </AnimatePresence>
        </PreviewDeviceFrame>
        
        {/* Navigation controls */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={goToPreviousPage}
            disabled={currentPageIndex === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            ← Previous Page
          </button>
          
          {/* Page indicator dots */}
          <div className="flex items-center space-x-1">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setTransitionDirection(index > currentPageIndex ? 'left' : 'right');
                  setCurrentPageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPageIndex 
                    ? 'bg-blue-600 w-4' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                style={{
                  backgroundColor: index === currentPageIndex ? primaryColor : undefined
                }}
              />
            ))}
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Next Page →
          </button>
        </div>
      </div>
    </div>
  );
};

export default JourneyPreview;