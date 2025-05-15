"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifySuccessPage() {
  const [countdown, setCountdown] = useState(5);
  
  // Countdown timer for automatic redirect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/login';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Email Verified Successfully!</h1>
        
        <p className="text-gray-600 mb-6">
          Your email has been verified. You can now log in to your BoothBuddy account.
        </p>
        
        <div className="mb-6">
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          >
            Log in to your account
          </Link>
        </div>
        
        <p className="text-sm text-gray-500">
          Redirecting to login page in {countdown} seconds...
        </p>
      </div>
    </div>
  );
} 