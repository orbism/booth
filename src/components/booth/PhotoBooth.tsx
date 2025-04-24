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
import { processVideo } from '@/lib/video-processor';

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
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [ffmpegError, setFfmpegError] = useState<boolean>(false);

  // Filters variables
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [parsedFilters, setParsedFilters] = useState<string[]>(['normal']);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [videoFilter, setVideoFilter] = useState<string>('normal');

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

  // Update the video element when webcamRef changes
  useEffect(() => {
    if (webcamRef.current && webcamRef.current.video) {
      setVideoElement(webcamRef.current.video);
    }
  }, [webcamRef.current]);
  
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
      // Show filter selection for **both** photo and video modes if filters are enabled
      if (filtersEnabled) {
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

    if (filtersEnabled) {
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
    // For photo capture with filter
    if (captureMode === 'photo') {
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
              
              // Apply filter - FIXED: Make sure we're mapping CSS filter to canvas filter correctly
              const filterCSS = AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css;
              if (filterCSS) {
                ctx.filter = filterCSS;
                // Draw the image again with the filter applied
                ctx.drawImage(img, 0, 0);
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
      }
    } else {
      startVideoRecording();

      // Track video recording started || TODO: actually add this to our analytics
      // if (analyticsId) {
      //   await trackBoothEvent(analyticsId, 'video_recording_started', {
      //     filter: selectedFilter
      //   });
      // }
    }
  };

  // Start video recording handler
  const startVideoRecording = () => {
    console.log('==== STARTING SIMPLIFIED VIDEO RECORDING ====');
    
    if (!webcamRef.current) {
      console.error('Webcam reference not available');
      setError({
        title: "Recording Error", 
        message: "Camera not available. Please refresh and try again."
      });
      return;
    }
    
    const videoElement = webcamRef.current.video;
    if (!videoElement || !videoElement.srcObject) {
      console.error('Video stream not available');
      setError({
        title: "Recording Error",
        message: "Video stream not available. Please refresh and try again."
      });
      return;
    }
  
    try {
      // Store filter for preview
      setVideoFilter(selectedFilter);
      
      // Apply filter to video element for visual preview only
      if (selectedFilter !== 'normal') {
        const filterCSS = AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css || '';
        if (videoElement) {
          videoElement.style.filter = filterCSS;
        }
      }
      
      // Clear any old recorded chunks
      recordedChunksRef.current = [];
      
      // Create direct MediaRecorder with minimal options
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(videoElement.srcObject as MediaStream, {
          mimeType: 'video/webm'
        });
      } catch (e) {
        // Fallback with no options
        mediaRecorder = new MediaRecorder(videoElement.srcObject as MediaStream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up simple data handler
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size, 'bytes');
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log('Chunk added, total chunks:', recordedChunksRef.current.length);
        }
      };
      
      // Set up simple stop handler
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks available:', recordedChunksRef.current.length);
        
        if (recordedChunksRef.current.length > 0) {
          console.log('Creating video from chunks');
          const videoBlob = new Blob(recordedChunksRef.current, {
            type: 'video/webm'
          });
          const url = URL.createObjectURL(videoBlob);
          setVideoUrl(url);
          
          // Force stage transition
          console.log('Transitioning to preview stage');
          setStage('preview');
        } else {
          console.error('No chunks available after recording');
          createFallbackVideo();
        }
      };
      
      // Start recording with very frequent data requests
      console.log('Starting MediaRecorder with 200ms timeslice');
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      
      // Request data frequently
      mediaRecorder.start(200);
      
      // Setup timer to stop recording
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      
      recordingTimerRef.current = setTimeout(() => {
        stopVideoRecording();
      }, videoDuration * 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setError({
        title: "Recording Error",
        message: error instanceof Error ? error.message : "Failed to start recording"
      });
      createFallbackVideo();
    }
  };

  // Helper function to create a fallback video/image when recording fails
  const createFallbackVideo = () => {
    console.log('Creating fallback video content');
    
    // Create a simple canvas with text as a fallback
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 640;
    fallbackCanvas.height = 480;
    const ctx = fallbackCanvas.getContext('2d');
    
    if (ctx) {
      // Draw a simple message on the canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Video recording failed', fallbackCanvas.width/2, fallbackCanvas.height/2 - 20);
      ctx.fillText('Please try again', fallbackCanvas.width/2, fallbackCanvas.height/2 + 20);
      
      // Create a blob from the canvas
      fallbackCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setStage('preview');
        }
      }, 'image/png');
    }
  };

  // Stop video recording // TODO: extend to have pause/resume support (toggle in dash)
  const stopVideoRecording = async (): Promise<void> => {
    console.log('==== STOPPING VIDEO RECORDING ====');
    
    // Set recording state to false
    setIsRecording(false);
    
    // Clear any timers
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Check if we have a media recorder
    if (!mediaRecorderRef.current) {
      console.error('No media recorder available');
      createFallbackVideo();
      return;
    }
    
    try {
      // Only try to stop if we're recording
      if (mediaRecorderRef.current.state === "recording") {
        console.log('Stopping active media recorder');
        
        // Request final data
        mediaRecorderRef.current.requestData();
        
        // Stop the recorder
        mediaRecorderRef.current.stop();
        
        // Replace the onstop handler
        mediaRecorderRef.current.onstop = async () => {
          console.log('MediaRecorder stopped, chunks available:', recordedChunksRef.current.length);
          
          if (recordedChunksRef.current.length > 0) {
            console.log('Creating video from chunks');
            const videoBlob = new Blob(recordedChunksRef.current, {
              type: 'video/webm'
            });
            
            // Start video processing if a filter is selected
            if (selectedFilter !== 'normal') {
              setIsProcessingVideo(true);
              setProcessingProgress(0);
              
              try {
                // Process the video with the selected filter
                const processedBlob = await processVideo(videoBlob, {
                  filterId: selectedFilter,
                  onProgress: (progress: number) => setProcessingProgress(progress)
                });
                
                // Create URL from processed blob
                const url = URL.createObjectURL(processedBlob);
                setVideoUrl(url);
              } catch (error) {
                console.error('Error processing video:', error);
                setFfmpegError(true);
                // Fallback to original video if processing fails
                const url = URL.createObjectURL(videoBlob);
                setVideoUrl(url);
              } finally {
                setIsProcessingVideo(false);
              }
            } else {
              // No filter needed, use original video
              const url = URL.createObjectURL(videoBlob);
              setVideoUrl(url);
            }
            
            // Track video captured
            if (analyticsId) {
              trackBoothEvent(analyticsId, 'video_captured', {
                filter: selectedFilter
              }).catch(err => console.error('Failed to track video captured:', err));
            }
            
            // Transition to preview stage
            console.log('Transitioning to preview stage');
            setStage('preview');
          } else {
            console.error('No chunks available after recording');
            createFallbackVideo();
          }
        };
      } else {
        console.log('Media recorder not in recording state');
        createFallbackVideo();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      createFallbackVideo();
    }
  };

  // Handle photo or video retake
  const handleRetake = async () => {
    setPhotoDataUrl(null);
    setVideoUrl(null); // Reset video URL
    
    // Go back to filter selection if filters are enabled, otherwise to countdown
    if (filtersEnabled) {
      setStage('select-filter');
    } else {
      setStage('countdown');
    }
    
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
  const handleSendVideoEmail = async (): Promise<any> => {
    if (!userData || !videoUrl) return;

    try {
      setError(null);
      
      // Convert video URL to blob for upload
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', blob, 'video.mp4'); // Now it's MP4
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('mediaType', 'video');
      formData.append('filter', selectedFilter); // Add filter info
      
      // Add analytics ID if available
      if (analyticsId) {
        formData.append('analyticsId', analyticsId);
      }
      
      // Track video approved
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'video_approved', {
          filter: selectedFilter,
          processingApplied: selectedFilter !== 'normal',
        });
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
            mediaType: 'video',
            filter: selectedFilter,
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
    setVideoUrl(null);
    setJourneyCompleted(false);
    setSelectedFilter('normal'); // Reset selected filter
    
    // Clear any active media recorders
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping media recorder during reset:', e);
      }
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    
    // Reset recording state
    setIsRecording(false);
    setRecordingStartTime(null);
    
    // Don't reset analytics ID to maintain session continuity
    sessionStartTimeRef.current = Date.now();
    
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Reset video element filter if it exists
    if (videoRef.current) {
      videoRef.current.style.filter = '';
    }
    
    // Clean up any video element references
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.style.filter = '';
    }
    setVideoElement(null);
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

          // Select filter overlay
          case 'select-filter':
            return (
              <div className="relative">
                <div className="aspect-video bg-black rounded overflow-hidden relative">
                  <Webcam
                    audio={captureMode === 'video'}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                    mirrored={true}
                    onUserMediaError={() => setIsCameraError(true)}
                    onUserMedia={(stream) => {
                      if (webcamRef.current && webcamRef.current.video) {
                        setVideoElement(webcamRef.current.video);
                      }
                    }}
                  />
                  
                  <FiltersSelector
                    enabledFilters={parsedFilters}
                    onSelectFilter={handleFilterSelect}
                    onConfirm={handleFilterConfirm}
                    videoElement={videoElement}
                    selectedFilter={selectedFilter}
                  />
                </div>
              </div>
            );
        
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
                  ) : isProcessingVideo ? (
                    <div className="p-6 flex flex-col items-center justify-center">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold mb-2">Processing Video</h3>
                        <p className="text-gray-600">
                          Applying {AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.name || 'selected'} filter...
                        </p>
                      </div>
                      <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-4">
                        <div 
                          className="bg-blue-600 h-4 rounded-full transition-all duration-300" 
                          style={{ width: `${processingProgress}%` }} 
                        />
                      </div>
                      <p className="text-gray-600">{processingProgress}% complete</p>
                    </div>
                  ) : ffmpegError ? (
                    <div className="relative">
                      <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-l-4 border-yellow-500 p-4">
                        <p className="text-yellow-700">
                          <strong>Note:</strong> Filter could not be applied due to technical limitations.
                          Your video was captured successfully but is shown without the filter.
                        </p>
                      </div>
                      <VideoPreview
                        videoUrl={videoUrl as string}
                        userName={userData.name}
                        userEmail={userData.email}
                        onSendEmail={handleSendVideoEmail}
                        onRetake={handleRetake}
                      />
                    </div>
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