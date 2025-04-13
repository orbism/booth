// src/components/layouts/BoothLayout.tsx

import React from 'react';

interface BoothLayoutProps {
  children: React.ReactNode;
}

const BoothLayout: React.FC<BoothLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">BoothBoss Photo Experience</h1>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-hidden">
          {children}
        </div>
      </main>
      <footer className="bg-gray-800 text-white p-2 text-center text-sm">
        Powered by BoothBoss &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default BoothLayout;