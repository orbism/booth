// src/components/booth/PhotoBooth.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import UserInfoForm from '@/components/forms/UserInfoForm';
import CountdownTimer from '@/components/booth/CountdownTimer';
import PhotoPreview from '@/components/booth/PhotoPreview';
import ErrorMessage from '@/components/ui/ErrorMessage';
import JourneyContainer from '@/components/journey/JourneyContainer';
import { JourneyPage } from '@/types/journey';
import SplashPage from './SplashPage';

import { v4 as uuidv4 } from 'uuid';
import { trackBoothEvent } from '@/lib/analytics';

type UserData = {
  name: string;
  email: string;
};

type BoothStage = 'splash' | 'collect-info' | 'countdown' | 'preview' | 'complete';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  borderColor: string;
  buttonColor: string;
  textColor: string;
}

interface PhotoBoothProps {
  countdownSeconds?: number;
  resetTimeSeconds?: number;
  themeSettings?: ThemeSettings;
  customJourneyEnabled?: boolean;
  journeyPages?: JourneyPage[];
  splashPageEnabled?: boolean;
  splashPageTitle?: string;
  splashPageContent?: string;
  splashPageImage?: string | null;
  splashPageButtonText?: string;
  captureMode?: 'photo' | 'video';
  photoOrientation?: string;
  photoResolution?: string;
  photoEffect?: string;
  printerEnabled?: boolean;
  aiImageCorrection?: boolean;
  videoOrientation?: string;
  videoResolution?: string;
  videoEffect?: string;
  videoDuration?: number;
}

const PhotoBooth: React.FC<PhotoBoothProps> = ({
  countdownSeconds = 3,
  resetTimeSeconds = 60,
  themeSettings = {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    buttonColor: '#3B82F6',
    textColor: '#111827',
  },
  customJourneyEnabled = false,
  journeyPages = [],
  splashPageEnabled = false,
  splashPageTitle = 'Welcome to Our Photo Booth',
  splashPageContent = 'Get ready for a fun photo experience!',
  splashPageImage = null,
  splashPageButtonText = 'Start',
}) => {
  const [stage, setStage] = useState<BoothStage>(splashPageEnabled ? 'splash' : 'collect-info');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCameraError, setIsCameraError] = useState<boolean>(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // User journey
  const [journeyCompleted, setJourneyCompleted] = useState(false);

  // Analytics tracking
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Video related variables
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Extract captureMode from props with default value -- TODO: pass these all through props.
  // const {
  //   captureMode = 'photo',
  //   videoDuration = 10,
  //   photoOrientation = 'portrait-standard',
  //   photoResolution = 'medium',
  //   photoEffect = 'none',
  //   videoOrientation = 'portrait-standard',
  //   videoResolution = 'medium',
  //   videoEffect = 'none',
  //   printerEnabled = false,
  //   aiImageCorrection = false,
  // } = props;

  const captureMode = 'photo'; // Default values since they're not passed through props yet
  const videoDuration = 10;

  // Initialize tracking session
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {

        console.log('Initializing analytics session');
        
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
            console.log('Analytics session started with ID:', data.id);
            setAnalyticsId(data.id);
          }
        } else {
          console.error('Failed to start analytics session:', await response.text());
        }
        
        // Track view start event
        await trackBoothEvent(localAnalyticsId, 'view_start');
        console.log('Tracked view_start event');
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
        console.log('Tracking session end on unmount, duration:', duration);
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
  }, []);

  // Add this useEffect after the initial useEffect blocks
  useEffect(() => {
    // Setup media recorder when webcam reference is available and in video mode
    if (webcamRef.current && captureMode === 'video' && stage === 'countdown') {
      const videoElement = webcamRef.current.video;
      if (videoElement && videoElement.srcObject) {
        // Clear any old recorded chunks
        recordedChunksRef.current = [];
        
        // Create media recorder
        const mediaRecorder = new MediaRecorder(videoElement.srcObject as MediaStream);
        mediaRecorderRef.current = mediaRecorder;
        
        // Set up event handlers
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(recordedChunksRef.current, {
            type: 'video/webm'
          });
          const url = URL.createObjectURL(videoBlob);
          setVideoUrl(url);
          setStage('preview');
        };
      }
    }
    
    // Cleanup function
    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [webcamRef.current, captureMode, stage]);
  
  // Handle splash page completion
  const handleSplashComplete = () => {
    setStage('collect-info');
    
    // Track event if analytics is enabled
    if (analyticsId) {
      trackBoothEvent(analyticsId, 'splash_complete');
    }
  };
  
  // Handle user info submission
  const handleUserInfoSubmit = async (data: UserData) => {
    setUserData(data);
    
    // Track info submission
    if (analyticsId) {
      await trackBoothEvent(analyticsId, 'info_submitted', {
        hasName: !!data.name,
        emailDomain: data.email.split('@')[1],
      });
    }

    if (!customJourneyEnabled) {
      // Only advance to countdown if there's no custom journey
      setStage('countdown');
    }
  };

  // Handle journey completion
  const handleJourneyComplete = () => {
    setJourneyCompleted(true);
    setStage('countdown');
    
    // Track journey completion
    if (analyticsId) {
      trackBoothEvent(analyticsId, 'journey_complete');
    }
  };
  

  // Handle countdown completion
  const handleCountdownComplete = async () => {
    if (captureMode === 'photo') {
      // Existing photo capture logic
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
      }
    } else {
      // Start video recording
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      
      // Set up recording timer
      recordingTimerRef.current = setTimeout(() => {
        stopVideoRecording();
      }, videoDuration * 1000);
      
      // Track video recording started
      if (analyticsId) {
        // await trackBoothEvent(analyticsId, 'video_recording_started'); //TODO: set this up
        await trackBoothEvent(analyticsId, 'photo_captured'); // Reusing existing event type for now
      }
    }
  };

  // Stop video recording
  const stopVideoRecording = async () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    // Track video recording completed
    if (analyticsId) {
      // await trackBoothEvent(analyticsId, 'video_captured'); // TODO: set this up
      await trackBoothEvent(analyticsId, 'photo_captured'); // Reusing existing event type for now

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

  const handleSendVideoEmail = async () => {
    if (!userData || !videoUrl) return;
  
    try {
      setError(null);
      
      // Convert video URL to blob for upload
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', blob, 'video.mp4');
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('mediaType', 'video');
      
      // Add analytics ID if available
      if (analyticsId) {
        formData.append('analyticsId', analyticsId);
      }
      
      // Track video approved
      if (analyticsId) {
        //await trackBoothEvent(analyticsId, 'video_approved'); // TODO: set this up
        await trackBoothEvent(analyticsId, 'photo_approved'); // Reusing existing event type for now
      }
      
      // Send to API endpoint
      const result = await fetch('/api/booth/capture', {
        method: 'POST',
        body: formData,
      });
      
      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error?.message || 'Failed to upload video');
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
          : 'Failed to send video. Please try again.'
      });
      throw error;
    }
  };

  // Reset the booth to initial state
  const resetBooth = () => {
    setStage(splashPageEnabled ? 'splash' : 'collect-info');
    
    // Reset user data and other state
    setUserData(null);
    setSessionId(null);
    setPhotoDataUrl(null);
    setJourneyCompleted(false); // Also reset journey completed state
    
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
      case 'splash':
        return (
          <SplashPage
            title={splashPageTitle}
            content={splashPageContent}
            backgroundImage={splashPageImage}
            buttonText={splashPageButtonText}
            onNext={handleSplashComplete}
          />
        );

        case 'collect-info':
          // First show user info form
          if (!userData) {
            return <UserInfoForm onSubmit={handleUserInfoSubmit} />;
          }
          
          // After user info is collected, show custom journey if enabled and not completed
          if (customJourneyEnabled && !journeyCompleted) {
            return (
              <JourneyContainer
                pages={journeyPages}
                primaryColor={themeSettings.primaryColor}
                buttonColor={themeSettings.buttonColor}
                onComplete={handleJourneyComplete}
                analyticsId={analyticsId}
              />
            );
          }
          
          // If no journey or journey completed, advance to countdown
          setStage('countdown');
          return null;
        
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
          return userData && (captureMode === 'photo' ? photoDataUrl : videoUrl) ? (
            <>
              {error && (
                <ErrorMessage
                  title={error.title}
                  message={error.message}
                  onRetry={() => setError(null)}
                  className="mb-4"
                />
              )}
              {captureMode === 'photo' ? (
                <PhotoPreview
                  photoDataUrl={photoDataUrl as string}
                  userName={userData.name}
                  userEmail={userData.email}
                  onSendEmail={handleSendEmail}
                  onRetake={handleRetake}
                />
              ) : (
                <VideoPreview
                  videoUrl={videoUrl as string}
                  userName={userData.name}
                  userEmail={userData.email}
                  onSendEmail={handleSendVideoEmail}
                  onRetake={handleRetake}
                />
              )}
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