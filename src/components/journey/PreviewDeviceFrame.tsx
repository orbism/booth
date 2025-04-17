// src/components/journey/PreviewDeviceFrame.tsx
import React from 'react';

interface PreviewDeviceFrameProps {
  children: React.ReactNode;
  device: 'mobile' | 'tablet' | 'desktop';
  backgroundColor?: string;
}

const PreviewDeviceFrame: React.FC<PreviewDeviceFrameProps> = ({ 
  children, 
  device,
  backgroundColor = '#ffffff'
}) => {
  // Device-specific styles
  const deviceStyles = {
    mobile: {
      width: '320px',
      height: '600px',
      borderRadius: '20px',
      padding: '10px',
    },
    tablet: {
      width: '768px',
      height: '500px', 
      borderRadius: '12px',
      padding: '15px',
    },
    desktop: {
      width: '100%', 
      maxWidth: '1024px',
      height: '600px',
      borderRadius: '8px', 
      padding: '20px',
    }
  };
  
  const style = deviceStyles[device];
  
  return (
    <div 
      className="flex justify-center items-center p-4 bg-gray-200 flex-1 overflow-auto"
    >
      <div 
        style={{
          ...style,
          backgroundColor,
          border: '8px solid #333',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
        className="relative overflow-hidden"
      >
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PreviewDeviceFrame;