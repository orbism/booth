// src/app/loading.tsx

import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700 mx-auto"></div>
        <h3 className="mt-4 text-xl font-semibold">Loading photo booth...</h3>
        <p className="text-gray-500 mt-2">Please wait while we set up the experience</p>
      </div>
    </div>
  );
}