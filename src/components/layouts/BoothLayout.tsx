// src/components/layouts/BoothLayout.tsx

import React from 'react';
import Image from 'next/image';

interface BoothLayoutProps {
  children: React.ReactNode;
  eventName?: string;
  companyName?: string;
  companyLogo?: string | null;
  primaryColor?: string;
  showBranding?: boolean;
  eventUrlId?: string;
}

const BoothLayout: React.FC<BoothLayoutProps> = ({ 
  children,
  eventName = 'Photo Booth Experience',
  companyName,
  companyLogo,
  primaryColor = '#3B82F6',
  showBranding = true,
  eventUrlId
}) => {
  // Style variables
  const headerStyle = {
    backgroundColor: primaryColor,
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="text-white p-4 shadow-md" style={headerStyle}>
        <div className="container mx-auto flex items-center justify-between">
          {companyLogo ? (
            <div className="flex items-center">
              <div className="h-10 w-10 relative mr-3">
                <Image
                  src={companyLogo}
                  alt={companyName || 'Company Logo'}
                  fill
                  style={{ objectFit: 'contain' }}
                  className="rounded"
                />
              </div>
              <h1 className="text-2xl font-bold">{eventName}</h1>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">{eventName}</h1>
          )}
          
          {companyName && (
            <div className="text-sm font-medium">
              Presented by {companyName}
            </div>
          )}
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-hidden">
          {children}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white p-2 text-center text-sm">
        {showBranding ? (
          <>Powered by BoothBuddy &copy; {new Date().getFullYear()}</>
        ) : (
          <>&copy; {new Date().getFullYear()} {companyName || eventName}</>
        )}
      </footer>
    </div>
  );
};

export default BoothLayout;