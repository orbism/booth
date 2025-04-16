// src/components/journey/JourneyPageView.tsx (renamed from JourneyPage.tsx)
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
}) => {
  return (
    <div className="relative min-h-[60vh] flex flex-col justify-between p-6">
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
        <div 
          className="max-w-md mx-auto text-lg"
          dangerouslySetInnerHTML={{ __html: content }}
        ></div>
      </div>
      
      <div className="relative z-10 flex justify-center mt-8">
        {buttonImage ? (
          <button
            onClick={onNext}
            className="relative shadow-md rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <OptimizedImage
              src={buttonImage}
              alt={buttonText}
              width={200}
              height={60}
            />
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-6 py-3 rounded-lg shadow-md text-lg font-medium transition-colors"
            style={{ 
              backgroundColor: buttonColor,
              color: getContrastTextColor(buttonColor)
            }}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default JourneyPageView;