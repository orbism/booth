// src/components/booth/PhotoBooth.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import UserInfoForm from '@/components/forms/UserInfoForm';
import CountdownTimer from '@/components/booth/CountdownTimer';
import PhotoPreview from '@/components/booth/PhotoPreview';

type UserData = {
  name: string;
  email: string;
};

type BoothStage = 'collect-info' | 'countdown' | 'preview' | 'complete';

interface PhotoBoothProps {
  countdownSeconds?: number;
  resetTimeSeconds?: number;
}

const PhotoBooth: React.FC<PhotoBoothProps> = ({
  countdownSeconds = 3,
  resetTimeSeconds = 60
}) => {
  const [stage, setStage] = useState<BoothStage>('collect-info');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    videoRef, 
    photoDataUrl, 
    isLoading, 
    error: cameraError, 
    isCameraReady,
    takePhoto, 
    resetPhoto 
  } = useCamera();

  // Handle user info submission
  const handleUserInfoSubmit = (data: UserData) => {
    setUserData(data);
    setStage('countdown');
  };

  // Handle countdown completion
  const handleCountdownComplete = () => {
    takePhoto();
    setStage('preview');
  };

  // Handle photo retake
  const handleRetake = () => {
    resetPhoto();
    setStage('countdown');
  };

  // Send email with photo
  const handleSendEmail = async () => {
    if (!userData || !photoDataUrl) return;

    try {
      // Convert data URL to blob for upload
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('photo', blob, 'photo.jpg');
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      
      // Send to API endpoint
      const result = await fetch('/api/booth/capture', {
        method: 'POST',
        body: formData,
      });
      
      if (!result.ok) {
        throw new Error('Failed to upload photo');
      }
      
      const data = await result.json();
      setSessionId(data.sessionId);
      setStage('complete');
      
      // Start reset timer
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      
      resetTimerRef.current = setTimeout(() => {
        resetBooth();
      }, resetTimeSeconds * 1000);
      
      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  // Reset the booth to initial state
  const resetBooth = () => {
    setStage('collect-info');
    setUserData(null);
    setSessionId(null);
    resetPhoto();
    
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  // Render different stages
  const renderStage = () => {
    switch (stage) {
      case 'collect-info':
        return (
          <UserInfoForm onSubmit={handleUserInfoSubmit} />
        );
        
      case 'countdown':
        return (
          <div className="relative">
            <div className="aspect-video bg-black rounded overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <CountdownTimer
                seconds={countdownSeconds}
                onComplete={handleCountdownComplete}
                onCancel={() => setStage('collect-info')}
              />
            </div>
          </div>
        );
        
      case 'preview':
        return userData && photoDataUrl ? (
          <PhotoPreview
            photoDataUrl={photoDataUrl}
            userName={userData.name}
            userEmail={userData.email}
            onSendEmail={handleSendEmail}
            onRetake={handleRetake}
          />
        ) : (
          <div className="p-6 text-center text-red-600">
            Error: Missing photo or user data
          </div>
        );
        
      case 'complete':
        return (
          <div className="p-6 text-center">
            <div className="text-3xl text-green-600 mb-4">Thank You!</div>
            <p className="mb-8">
              Your photo has been sent to your email.
              This booth will reset in {resetTimeSeconds} seconds.
            </p>
            <button
              onClick={resetBooth}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start Over
            </button>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        <p className="mt-4">Initializing camera...</p>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="p-6 text-center text-red-600">
        <p className="text-xl font-bold mb-2">Camera Error</p>
        <p>{cameraError}</p>
        <p className="mt-4 text-sm">
          Please ensure camera access is granted and try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="photo-booth">
      {renderStage()}
    </div>
  );
};

export default PhotoBooth;