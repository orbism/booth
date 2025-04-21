// src/components/booth/PhotoBooth.tsx
"use client";
import React, { useState, useRef, useEffect, RefObject } from 'react';
import Webcam from 'react-webcam';
import UserInfoForm from '@/components/forms/UserInfoForm';
import CountdownTimer from '@/components/booth/CountdownTimer';
import PhotoPreview from '@/components/booth/PhotoPreview';
import ErrorMessage from '@/components/ui/ErrorMessage';
import JourneyContainer from '@/components/journey/JourneyContainer';
import { JourneyPage } from '@/types/journey';
import SplashPage from './SplashPage';
import VideoPreview from './VideoPreview';
import FiltersSelector from './FiltersSelector';
import { AVAILABLE_FILTERS } from '../forms/tabs/FiltersTab';

import { v4 as uuidv4 } from 'uuid';
import { trackBoothEvent } from '@/lib/analytics';

type UserData = {
  name: string;
  email: string;
};

type BoothStage = 'splash' | 'collect-info' | 'select-filter' | 'countdown' | 'preview' | 'complete';

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
  filtersEnabled?: boolean;
  enabledFilters?: string | null;
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
  captureMode = 'photo', 
  photoOrientation = 'portrait-standard',
  photoResolution = 'medium',
  photoEffect = 'none',
  videoOrientation = 'portrait-standard',
  videoResolution = 'medium',
  videoEffect = 'none',
  videoDuration = 10,
  printerEnabled = false,
  aiImageCorrection = false,
  filtersEnabled = false,
  enabledFilters = null,
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
  const [remainingTime, setRemainingTime] = useState<number>(videoDuration);
  const videoRef = useRef<HTMLVideoElement>(webcamRef.current?.video || null) as RefObject<HTMLVideoElement>;
  // Filters variables
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [parsedFilters, setParsedFilters] = useState<string[]>(['normal']);

  // Parse the enabledFilters JSON string
  useEffect(() => {
    if (enabledFilters) {
      try {
        const parsed = JSON.parse(enabledFilters);
        setParsedFilters(Array.isArray(parsed) ? parsed : ['normal']);
      } catch (e) {
        console.error('Failed to parse enabled filters:', e);
        setParsedFilters(['normal']);
      }
    }
  }, [enabledFilters]);

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

  // Enhanced video state handling
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

  // Handle the recording timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const remaining = Math.max(0, videoDuration - elapsed);
        setRemainingTime(remaining);
        
        // If time is up, stop recording
        // (The stopVideoRecording function will handle the transition to preview)
        if (remaining <= 0) {
          stopVideoRecording();
        }
      }, 200); // Update more frequently for smoother countdown
    } else {
      // Reset the timer when not recording
      setRemainingTime(videoDuration);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime, videoDuration]);
  
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
      if (filtersEnabled && captureMode === 'photo') {
        setStage('select-filter');
      } else {
        setStage('countdown');
      }
    }
  };

  // Filter selection handler
  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
  };

  // Filter confirmation handler
  const handleFilterConfirm = () => {
    // Track filter selection
    if (analyticsId) {
      trackBoothEvent(analyticsId, 'filter_selected', {
        filterId: selectedFilter,
        filterName: AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.name || 'Unknown'
      });
    }
    setStage('countdown');
  };

  // Handle journey completion
  const handleJourneyComplete = () => {
    setJourneyCompleted(true);

    if (filtersEnabled && captureMode === 'photo') {
      setStage('select-filter');
    } else {
      setStage('countdown');
    }
    
    // Track journey completion
    if (analyticsId) {
      trackBoothEvent(analyticsId, 'journey_complete');
    }
  };

  // Handle countdown completion
  const handleCountdownComplete = async () => {
    if (captureMode === 'photo') {
      // Existing photo capture logic with filter support
      if (webcamRef.current) {
        const screenshot = webcamRef.current.getScreenshot();
        
        // If there's a selected filter other than 'normal', apply it
        if (selectedFilter !== 'normal') {
          // Apply filter to the image
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Draw the original image
              ctx.drawImage(img, 0, 0);
              
              // Apply filter
              const filterCSS = AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css;
              if (filterCSS) {
                ctx.filter = filterCSS;
                ctx.drawImage(canvas, 0, 0);
                ctx.filter = 'none'; // Reset filter
              }
              
              // Convert back to data URL
              const filteredDataUrl = canvas.toDataURL('image/jpeg', 0.92);
              setPhotoDataUrl(filteredDataUrl);
              setStage('preview');
            }
          };
          img.src = screenshot as string;
        } else {
          // No filter, use original image
          setPhotoDataUrl(screenshot);
          setStage('preview');
        }
        
        // Track photo captured
        if (analyticsId) {
          await trackBoothEvent(analyticsId, 'photo_captured', {
            filter: selectedFilter
          });
        }
      } else {
        console.error('Webcam reference not available');
      }
    } else {
      // For video, we'll apply the filter during recording
      startVideoRecording();
    }
  };

  // Start video recording handler
  const startVideoRecording = () => {
    if (!webcamRef.current) {
      console.error('Webcam reference not available');
      return;
    }
    
    const videoElement = webcamRef.current.video;
    if (!videoElement || !videoElement.srcObject) {
      console.error('Video stream not available');
      return;
    }

    // Apply filter to the video element if a filter is selected
    if (selectedFilter !== 'normal') {
      const filterCSS = AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css;
      if (filterCSS && videoElement) {
        videoElement.style.filter = filterCSS;
      }
    }
    
    // Clear any old recorded chunks
    recordedChunksRef.current = [];
    
    // Create media recorder
    try {
      const mediaRecorder = new MediaRecorder(videoElement.srcObject as MediaStream, {
        mimeType: 'video/webm;codecs=vp9' // Specify codec for better compatibility
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('Data available event, size:', event.data.size);
          recordedChunksRef.current.push(event.data);
        }
      };
      
      // Start recording
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      
      // Request data periodically to ensure we don't lose anything
      mediaRecorder.start(1000); // Request data every second
      console.log('Started video recording with 1s intervals');
      
      // Set up recording timer for max duration
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      
      recordingTimerRef.current = setTimeout(() => {
        stopVideoRecording();
      }, videoDuration * 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  // Stop video recording (with resume support)
  const stopVideoRecording = async () => {
    if (!mediaRecorderRef.current) {
      console.error('No media recorder available');
      return;
    }
    
    console.log('Stop video recording called, recorder state:', mediaRecorderRef.current.state);
    
    // Clear the recording timeout
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Immediately set recording state to false
    setIsRecording(false);
    
    try {
      // Request the final chunk of data
      if (mediaRecorderRef.current.state === "recording") {
        // Request data so far
        mediaRecorderRef.current.requestData();
        
        // Stop the recorder
        mediaRecorderRef.current.stop();
        console.log('Media recorder stopped');
      }
      
      // Create video from chunks without waiting for onstop event
      // This ensures we move to preview regardless of event firing
      if (recordedChunksRef.current.length > 0) {
        console.log('Creating video blob from', recordedChunksRef.current.length, 'chunks');
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        });
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
        
        // Force immediate stage transition regardless of onstop event
        setStage('preview');
      } else {
        console.error('No recorded chunks available');
      }
      
      // Track video recording completed
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'video_captured', {
          duration: recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0,
          resolution: videoResolution,
          manualStop: true, // Indicates user manually stopped the recording
          captureMode: captureMode
        });
      }
    } catch (error) {
      console.error('Error stopping video recording:', error);
      
      // Still try to create video from any chunks we have
      if (recordedChunksRef.current.length > 0) {
        const videoBlob = new Blob(recordedChunksRef.current, {
          type: 'video/webm'
        });
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
        setStage('preview');
      }
    }
  };

  // Handle photo or video retake
  const handleRetake = async () => {
    setPhotoDataUrl(null);
    setVideoUrl(null); // Reset video URL
    setStage('countdown');
    
    // Track retake with media type info
    if (analyticsId) {
      await trackBoothEvent(analyticsId, captureMode === 'photo' ? 'retake_photo' : 'retake_video', {
        mediaType: captureMode,
        captureMode: captureMode
      });
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
      
      // Track media approved
      if (analyticsId) {
        await trackBoothEvent(analyticsId, captureMode === 'photo' ? 'photo_approved' : 'video_approved', {
          ...(captureMode === 'video' ? {
            duration: recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0,
            resolution: videoResolution,
          } : {}),
          captureMode: captureMode
        });
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
            mediaType: captureMode
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

  // Video sending via email handler
  const handleSendVideoEmail = async () => {
    if (!userData || !videoUrl) return;

    try {
      setError(null);
      
      // Convert video URL to blob for upload
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', blob, 'video.webm'); // Changed extension to webm
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('mediaType', 'video');
      
      // Add analytics ID if available
      if (analyticsId) {
        formData.append('analyticsId', analyticsId);
      }
      
      // Track video approved
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'photo_approved'); // Reusing existing event type for now
      }
      
      // TODO: Update the API endpoint to handle video uploads
      // For now, we'll use the same endpoint as photos
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
      console.error('Error sending video email:', error);
      
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

  // Live remaining time counter during video recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording && recordingStartTime) {
      // Update the UI every second to show remaining time
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        
        // If we've reached the duration, stop recording
        if (elapsed >= videoDuration) {
          stopVideoRecording();
        } else {
          // Force a re-render to update the timer
          setRecordingStartTime(recordingStartTime);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime, videoDuration]);
  
  // Video constraints
  const videoConstraints = {
    width: videoResolution === 'high' ? 1920 : videoResolution === 'medium' ? 1280 : 640,
    height: videoResolution === 'high' ? 1080 : videoResolution === 'medium' ? 720 : 360,
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

          // Filter selection stage
          case 'select-filter':
            return (
              <div className="relative">
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <Webcam
                    audio={captureMode === 'video'}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                    mirrored={true}
                    onUserMediaError={() => setIsCameraError(true)}
                  />
                  
                  <FiltersSelector
                    enabledFilters={parsedFilters}
                    onSelectFilter={handleFilterSelect}
                    onConfirm={handleFilterConfirm}
                    videoRef={videoRef}
                  />
                </div>
              </div>
            );          
          
          // If no journey or journey completed, advance to countdown
          setStage('countdown');
          return null;
        
          case 'countdown':
            return (
              <div className="relative">
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <Webcam
                    audio={captureMode === 'video'} // Enable audio for video recording
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                    mirrored={true}
                    onUserMediaError={() => setIsCameraError(true)}
                  />
                  
                  {/* Recording indicator - only shown when video is recording */}
                  {captureMode === 'video' && isRecording && (
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white">
                      <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
                      <span className="font-medium">REC</span>
                      <span className="ml-2">{remainingTime}s</span>
                    </div>
                  )}
                  
                  {/* Control buttons */}
                  <div className="absolute bottom-4 left-4 z-10">
                    {/* "I'm Done" button - only shown when recording */}
                    {captureMode === 'video' && isRecording && (
                      <button
                        onClick={stopVideoRecording}
                        className="bg-blue-600 text-white font-medium px-4 py-2 rounded-full 
                                  hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        type="button"
                      >
                        I'm Done
                      </button>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Only show countdown if we're not recording yet */}
                  {!(captureMode === 'video' && isRecording) && !videoUrl && (
                    <CountdownTimer
                      seconds={countdownSeconds}
                      onComplete={handleCountdownComplete}
                      onCancel={() => setStage('collect-info')}
                    />
                  )}
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