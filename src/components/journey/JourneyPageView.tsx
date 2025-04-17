// src/components/journey/JourneyPageView.tsx
import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { getContrastTextColor } from '@/utils/theme-utils';

interface JourneyPageViewProps {
  title: string;
  content: string;
  backgroundImage: string | null;
  buttonText: string;
  buttonImage: string | null;
  primaryColor: string;
  buttonColor: string;
  onNext: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
  isPreview?: boolean;
  previewMode?: 'mobile' | 'tablet' | 'desktop';
}

const JourneyPageView: React.FC<JourneyPageViewProps> = ({
  title,
  content,
  backgroundImage,
  buttonText,
  buttonImage,
  primaryColor,
  buttonColor,
  onNext,
  onPrevious,
  isLoading = false,
  isPreview = false,
  previewMode = 'mobile'
}) => {
  // Function to render HTML content safely with support for embedded content
  const renderContent = () => {
    if (!content) return null;
    
    // Function to sanitize HTML (remove dangerous tags/attributes)
    // In a production app, you'd want to use a library like DOMPurify
    const sanitizedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '');
    
    return (
      <div 
        className="max-w-md mx-auto text-lg content-container"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    );
  };
  
  return (
    <div className={`relative flex flex-col justify-between ${
      isPreview ? 'h-full' : 'min-h-[60vh]'
    } p-6`}>
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src={backgroundImage}
            alt="Background"
            fill
            className="object-cover"
          />
          {/* Semi-transparent overlay for better text contrast */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
      )}
      
      <div className="relative z-10 text-center space-y-4">
        <h2 
          className="text-2xl font-bold"
          style={{ color: primaryColor }}
        >
          {title}
        </h2>
        {renderContent()}
      </div>
      
      <div className="relative z-10 flex justify-center mt-8 space-x-4">
        {onPrevious && (
          <button
            onClick={onPrevious}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg shadow-md text-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Back
          </button>
        )}
        
        {buttonImage ? (
          <button
            onClick={onNext}
            disabled={isLoading}
            className="relative shadow-md rounded-lg overflow-hidden hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <OptimizedImage
              src={buttonImage}
              alt={buttonText}
              width={200}
              height={60}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg shadow-md text-lg font-medium transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: buttonColor,
              color: getContrastTextColor(buttonColor)
            }}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              buttonText
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default JourneyPageView;