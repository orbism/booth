// src/components/booth/PhotoBooth.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import UserInfoForm from '@/components/forms/UserInfoForm';
import CountdownTimer from '@/components/booth/CountdownTimer';
import PhotoPreview from '@/components/booth/PhotoPreview';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { v4 as uuidv4 } from 'uuid';
import { trackBoothEvent } from '@/lib/analytics';

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
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCameraError, setIsCameraError] = useState<boolean>(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // Analytics tracking
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Initialize tracking session
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Generate a local tracking session ID
        const localAnalyticsId = uuidv4();
        setAnalyticsId(localAnalyticsId);
        
        // Record session start
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'session_start',
            sessionId: localAnalyticsId,
            userAgent: navigator.userAgent,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.id) {
            setAnalyticsId(data.id);
          }
        }
        
        // Track view start event
        trackBoothEvent(localAnalyticsId, 'view_start');
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };
    
    initializeAnalytics();
    sessionStartTimeRef.current = Date.now();
    
    return () => {
      // Track session end if component unmounts
      const duration = Date.now() - sessionStartTimeRef.current;
      if (analyticsId) {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'session_end',
            analyticsId,
            duration,
          }),
        }).catch(err => console.error('Failed to track session end:', err));
      }
    };
  }, [analyticsId]);
  
  
  
  // Handle user info submission
  const handleUserInfoSubmit = async (data: UserData) => {
    setUserData(data);
    setStage('countdown');
    
    // Track info submission
    if (analyticsId) {
      await trackBoothEvent(analyticsId, 'info_submitted', {
        hasName: !!data.name,
        emailDomain: data.email.split('@')[1],
      });
    }
  };

  // Handle countdown completion
  const handleCountdownComplete = async () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      setPhotoDataUrl(screenshot);
      setStage('preview');
      
      // Track photo captured
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'photo_captured');
      }
    } else {
      console.error('Webcam reference not available');
      setIsCameraError(true);
      
      // Track error
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'error', {
          type: 'camera_error',
          message: 'Webcam reference not available',
        });
      }
    }
  };

  // Handle photo retake
  const handleRetake = async () => {
    setPhotoDataUrl(null);
    setStage('countdown');
    
    // Track retake
    if (analyticsId) {
      await trackBoothEvent(analyticsId, 'retake_photo');
    }
  };

  // Send email with photo
  const handleSendEmail = async () => {
    if (!userData || !photoDataUrl) return;
  
    try {
      setError(null);
      
      // Convert data URL to blob for upload
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('photo', blob, 'photo.jpg');
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      
      // Add analytics ID if available
      if (analyticsId) {
        formData.append('analyticsId', analyticsId);
      }
      
      // Track photo approved
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'photo_approved');
      }
      
      // Send to API endpoint
      const result = await fetch('/api/booth/capture', {
        method: 'POST',
        body: formData,
      });
      
      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error?.message || 'Failed to upload photo');
      }
      
      const data = await result.json();
      setSessionId(data.sessionId);
      setStage('complete');
      
      // Track completion
      if (analyticsId) {
        const duration = Date.now() - sessionStartTimeRef.current;
        await trackBoothEvent(analyticsId, 'email_sent', {
          duration,
          boothSessionId: data.sessionId,
        });
        
        // Record session completion
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'session_complete',
            analyticsId,
            boothSessionId: data.sessionId,
            emailDomain: userData.email.split('@')[1],
            duration,
          }),
        });
      }
      
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
      
      // Track error
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'error', {
          type: 'email_error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      setError({
        title: 'Email Error',
        message: error instanceof Error 
          ? error.message 
          : 'Failed to send photo. Please try again.'
      });
      throw error;
    }
  };

  // Reset the booth to initial state
  const resetBooth = () => {
    setStage('collect-info');
    setUserData(null);
    setSessionId(null);
    setPhotoDataUrl(null);
    
    // Don't reset analytics ID to maintain session continuity
    sessionStartTimeRef.current = Date.now();
    
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

  // Video constraints
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };

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
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                mirrored={true}
                onUserMediaError={() => setIsCameraError(true)}
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
            <>
              {error && (
                <ErrorMessage
                  title={error.title}
                  message={error.message}
                  onRetry={() => setError(null)}
                  className="mb-4"
                />
              )}
              <PhotoPreview
                photoDataUrl={photoDataUrl}
                userName={userData.name}
                userEmail={userData.email}
                onSendEmail={handleSendEmail}
                onRetake={handleRetake}
              />
            </>
          ) : (
            <div className="p-6 text-center">
              <ErrorMessage
                title="Missing Data"
                message="Error: Missing photo or user data"
              />
              <button
                onClick={() => setStage('collect-info')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start Over
              </button>
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

  if (isCameraError) {
    return (
      <div className="p-6 text-center text-red-600">
        <p className="text-xl font-bold mb-2">Camera Error</p>
        <p>Failed to access camera. Please ensure camera access is granted and try refreshing the page.</p>
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