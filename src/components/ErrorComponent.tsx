import React from 'react';

interface ErrorComponentProps {
  message: string;
  code?: number;
}

const ErrorComponent: React.FC<ErrorComponentProps> = ({ 
  message = 'An error occurred', 
  code
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 my-8 bg-red-50 rounded-lg border border-red-200">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100">
        <svg className="w-8 h-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      {code && (
        <h2 className="text-xl font-bold text-red-800 mb-1">Error {code}</h2>
      )}
      <p className="text-center text-gray-700">{message}</p>
    </div>
  );
};

export default ErrorComponent; 