// src/components/booth/SplashPage.tsx
import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface SplashPageProps {
  title: string;
  content: string;
  backgroundImage: string | null;
  buttonText: string;
  onNext: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({
  title,
  content,
  backgroundImage,
  buttonText,
  onNext,
}) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative">
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src={backgroundImage}
            alt="Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
      )}
      
      <div className="relative z-10 text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-3xl font-bold text-white drop-shadow-lg">
          {title}
        </h2>
        <div 
          className="text-lg text-white drop-shadow-md"
          dangerouslySetInnerHTML={{ __html: content }}
        ></div>
      </div>
      
      <div className="relative z-10 mt-8">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg shadow-md text-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default SplashPage;