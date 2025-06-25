// src/components/booth/PhotoBooth.tsx
"use client";
import React, { useState, useRef, useEffect, RefObject, useMemo } from 'react';
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
import createCanvasRecorder, { CanvasVideoRecorder } from '@/lib/canvas-video-recorder';
import { detectCanvasCapabilities, getBrowserRecommendations } from '@/lib/browser-compatibility';

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
  eventUrlId?: string;
}

/**
 * Ensure proper typing of boolean values
 * 
 * In some cases, boolean values come in as strings from props,
 * which can lead to unexpected behavior.
 */
function ensureBoolean(value: any): boolean {
  // If it's already a boolean, return it directly
  if (typeof value === 'boolean') return value;
  
  // Handle string/number conversions
  if (value === '1' || value === 1 || value === 'true' || value === 'TRUE' || value === true) {
    return true;
  }
  
  // Everything else is false
  return false;
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
  eventUrlId = null,
}) => {
  // Log received props for debugging
  console.log(`[PhotoBooth] Received props:`, {
    captureMode,
    customJourneyEnabled: customJourneyEnabled,
    typeof_customJourneyEnabled: typeof customJourneyEnabled,
  });
  
  // Enhanced boolean conversion with detailed logging
  const isCJEnabled = useMemo(() => {
    const result = typeof customJourneyEnabled === 'boolean' 
      ? customJourneyEnabled 
      : customJourneyEnabled === 1 || customJourneyEnabled === '1' || customJourneyEnabled === 'true';
    
    console.log(`[PhotoBooth] customJourneyEnabled: ${customJourneyEnabled} (${typeof customJourneyEnabled}) → ${result}`);
    return result;
  }, [customJourneyEnabled]);
  
  // Ensure capture mode is valid
  const effectiveCaptureMode = useMemo(() => {
    const validMode = captureMode === 'video' ? 'video' : 'photo';
    
    if (validMode !== captureMode) {
      console.log(`[PhotoBooth] Invalid captureMode: ${captureMode}, using ${validMode}`);
    }
    
    return validMode;
  }, [captureMode]);
  
  // Ensure proper boolean types
  const isSplashPageEnabled = ensureBoolean(splashPageEnabled);
  const isPrinterEnabled = ensureBoolean(printerEnabled);
  const isAIImageCorrection = ensureBoolean(aiImageCorrection);
  const isFiltersEnabled = ensureBoolean(filtersEnabled);
  
  // Ensure capture mode is one of the expected values
  const safeMode = effectiveCaptureMode === 'video' ? 'video' : 'photo';
  
  // Log props for debugging
  useEffect(() => {
    console.log('[PhotoBooth] Initialized with props:', {
      captureMode: safeMode, 
      rawCaptureMode: captureMode,
      customJourneyEnabled: isCJEnabled,
      rawCJ: customJourneyEnabled,
      splashPageEnabled: isSplashPageEnabled,
      journeyPagesCount: journeyPages?.length || 0
    });
  }, [safeMode, captureMode, isCJEnabled, customJourneyEnabled, isSplashPageEnabled, journeyPages]);
  
  const [stage, setStage] = useState<BoothStage>(isSplashPageEnabled ? 'splash' : 'collect-info');
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
  const [isStoppingRecording, setIsStoppingRecording] = useState<boolean>(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [remainingTime, setRemainingTime] = useState<number>(videoDuration);
  const videoRef = useRef<HTMLVideoElement>(webcamRef.current?.video || null) as RefObject<HTMLVideoElement>;
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  
  // Canvas recorder reference
  const canvasRecorderRef = useRef<CanvasVideoRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Filters variables
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [parsedFilters, setParsedFilters] = useState<string[]>(['normal']);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [videoFilter, setVideoFilter] = useState<string>('normal');

  // Define processingPhase type
  type ProcessingPhase = 'waiting' | 'processing' | 'complete';
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>('waiting');
  
  // Add state for email processing
  const [isProcessingEmail, setIsProcessingEmail] = useState<boolean>(false);

  // Browser compatibility checks
  const [browserCompatibility, setBrowserCompatibility] = useState<any>(null);
  const [compatibilityWarning, setCompatibilityWarning] = useState<string | null>(null);
  
  // Check browser compatibility on component mount
  useEffect(() => {
    // Detect Canvas capabilities
    const capabilities = detectCanvasCapabilities();
    setBrowserCompatibility(capabilities);
    
    // Get recommendations for browser if needed
    if (!capabilities.filtersSupported && isFiltersEnabled) {
      const recommendations = getBrowserRecommendations(capabilities);
      if (recommendations.length > 0) {
        setCompatibilityWarning(recommendations[0]);
      }
    }
    
    console.log('Browser compatibility check:', capabilities);
  }, [isFiltersEnabled]);

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

    if (!isCJEnabled) {
      // Show filter selection for **both** photo and video modes if filters are enabled
      if (isFiltersEnabled) {
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

    if (isFiltersEnabled) {
      setStage('select-filter');
    } else {
      setStage('countdown');
    }
    
    // Track journey completion
    if (analyticsId) {
      trackBoothEvent(analyticsId, 'journey_complete');
    }

    console.log('Journey completed, moving to next stage');
  };

  // Handle countdown completion
  const handleCountdownComplete = async () => {
    // For photo capture with filter
    if (safeMode === 'photo') {
      if (webcamRef.current) {
        // Capture high-quality screenshot with custom dimensions
        const screenshot = webcamRef.current.getScreenshot(photoSettings.dimensions);
        
        if (!screenshot) {
          console.error('Failed to capture screenshot');
          return;
        }
        
        // Process the captured photo with filters and overlay
        const processPhoto = async (baseImageSrc: string) => {
          let processedImageSrc = baseImageSrc;
          
          // Apply filter if selected
          if (selectedFilter !== 'normal') {
            processedImageSrc = await new Promise<string>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = photoSettings.dimensions.width;
                canvas.height = photoSettings.dimensions.height;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  // Enable high-quality image rendering
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  
                  // Draw the original image scaled to target dimensions
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  
                  // Apply filter
                  const filterCSS = AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css;
                  if (filterCSS) {
                    ctx.filter = filterCSS;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    ctx.filter = 'none';
                  }
                  
                  // Convert back to data URL with enhanced quality
                  const filteredDataUrl = canvas.toDataURL('image/jpeg', photoSettings.quality);
                  resolve(filteredDataUrl);
                } else {
                  resolve(baseImageSrc);
                }
              };
              img.src = baseImageSrc;
            });
          } else if (photoResolution === 'high') {
            // For high resolution without filters, still enhance quality
            processedImageSrc = await new Promise<string>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = photoSettings.dimensions.width;
                canvas.height = photoSettings.dimensions.height;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  const enhancedDataUrl = canvas.toDataURL('image/jpeg', photoSettings.quality);
                  resolve(enhancedDataUrl);
                } else {
                  resolve(baseImageSrc);
                }
              };
              img.src = baseImageSrc;
            });
          }
          
          // Apply overlay to the processed image
          const finalImageWithOverlay = await applyOverlayToPhoto(processedImageSrc);
          setPhotoDataUrl(finalImageWithOverlay);
          setStage('preview');
        };
        
        // Start photo processing
        await processPhoto(screenshot);
        
        // Track photo captured with quality info
        if (analyticsId) {
          await trackBoothEvent(analyticsId, 'photo_captured', {
            filter: selectedFilter,
            resolution: photoResolution,
            dimensions: `${photoSettings.dimensions.width}x${photoSettings.dimensions.height}`,
            quality: photoSettings.quality
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
    console.log('==== STARTING CANVAS VIDEO RECORDING ====');
    
    // Reset processing state
    setIsProcessingVideo(false);
    setProcessingProgress(0);
    setProcessingPhase('waiting');
    
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
      
      // Always apply filter to video element for visual preview
      // This ensures users see the filter even if canvas filters fail
      if (selectedFilter !== 'normal') {
        const filterCSS = AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css || '';
        if (videoElement) {
          videoElement.style.filter = filterCSS;
        }
      }
      
      // Determine if we're in a compatible browser
      const capabilities = browserCompatibility || detectCanvasCapabilities();
      
      // Find the filter CSS from our available filters
      const filterCSS = selectedFilter !== 'normal'
        ? AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css || ''
        : '';
      
      console.log(`Creating canvas recorder with filter: ${selectedFilter} (CSS: ${filterCSS})`);
        
      // Create the canvas recorder with enhanced options
      canvasRecorderRef.current = createCanvasRecorder({
        filterCss: filterCSS,
        maxDuration: videoDuration,
        // Ensure we're using suitable dimensions based on video resolution
        width: videoResolution === 'high' ? 1920 : videoResolution === 'medium' ? 1280 : 640,
        height: videoResolution === 'high' ? 1080 : videoResolution === 'medium' ? 720 : 360,
        frameRate: 30, // Use consistent frame rate
        onProgress: (progress) => {
          console.log(`Recording progress: ${progress}%`);
          setProcessingProgress(progress);
        },
        onError: (error) => {
          console.error('Canvas recorder error:', error);
          // Only show blocking error if recording completely fails
          // For other errors, we'll continue with fallbacks
          if (error.message.includes('Failed to start') || error.message.includes('No media stream')) {
            setError({
              title: "Recording Error",
              message: error.message || "Failed to record video"
            });
            createFallbackVideo();
          }
        },
        onFilterError: (message) => {
          console.warn('Filter application error:', message);
          // We don't set this as a blocking error, just a notification
          // The recording continues but without the filter or with direct recording
          setCompatibilityWarning(message);
          
          // The video will still have the CSS filter applied visually,
          // but the recording won't have the filter applied in the canvas
        }
      });
      
      // Start recording with explicit error handling
      canvasRecorderRef.current.startRecording(videoElement)
        .then(() => {
          console.log('Canvas recording started successfully');
          setIsRecording(true);
          setRecordingStartTime(Date.now());
          
          // Setup timer to stop recording
          if (recordingTimerRef.current) {
            clearTimeout(recordingTimerRef.current);
          }
          
          recordingTimerRef.current = setTimeout(() => {
            console.log('Maximum recording duration reached, stopping automatically');
            stopVideoRecording();
          }, videoDuration * 1000);
          
          // Track recording started event if analytics is available
          if (analyticsId) {
            trackBoothEvent(analyticsId, 'video_captured', {
              filter: selectedFilter,
              videoDuration: videoDuration,
              resolution: videoResolution,
              recordingStarted: true,
              browser: capabilities?.browser?.name || 'unknown'
            }).catch(err => console.error('Failed to track recording start:', err));
          }
        })
        .catch((error) => {
          console.error('Failed to start canvas recording:', error);
          setIsRecording(false);
          setError({
            title: "Recording Error",
            message: error instanceof Error ? error.message : "Failed to start recording"
          });
          createFallbackVideo();
        });
      
    } catch (error) {
      console.error('Error setting up recording:', error);
      setIsRecording(false);
      setError({
        title: "Recording Error",
        message: error instanceof Error ? error.message : "Failed to set up recording"
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
          setIsStoppingRecording(false);
        }
      }, 'image/png');
    } else {
      // If canvas context couldn't be created, just reset the state
      setIsStoppingRecording(false);
    }
  };

  // Stop video recording function
  const stopVideoRecording = async (): Promise<void> => {
    console.log('==== STOPPING CANVAS VIDEO RECORDING ====');
    
    // Set recording states
    setIsRecording(false);
    setIsStoppingRecording(true);
    
    // Clear any timers
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Check if we have a canvas recorder
    if (!canvasRecorderRef.current) {
      console.error('No canvas recorder available');
      createFallbackVideo();
      return;
    }
    
    try {
      // Process the recording
      setProcessingPhase('processing');
      
      // Request to stop recording and get the video blob
      console.log('Requesting to stop canvas recording...');
      const videoBlob = await canvasRecorderRef.current.stopRecording();
      
      // Verify we got a valid blob
      if (!videoBlob || videoBlob.size === 0) {
        console.error('Received empty video blob');
        throw new Error('No video data was recorded');
      }
      
      // Log the blob details
      console.log('Canvas recording stopped successfully');
      console.log(`Video blob details: size=${videoBlob.size} bytes, type=${videoBlob.type}`);
      
      // Check if the blob is suspiciously small - might be a dummy/fallback video
      if (videoBlob.size < 1000) {
        console.warn('Video blob is suspiciously small, might be a fallback video');
        setCompatibilityWarning('Recording may have encountered issues. The video quality might be affected.');
      }
      
      // Create URL from blob
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      
      // Track success
      if (analyticsId) {
        const capabilities = browserCompatibility || detectCanvasCapabilities();
        trackBoothEvent(analyticsId, 'video_captured', {
          filter: selectedFilter,
          processed: selectedFilter !== 'normal',
          videoSize: videoBlob.size,
          videoType: videoBlob.type,
          browser: capabilities?.browser?.name || 'unknown',
          filtersSupported: capabilities?.filtersSupported || false,
          isDummyVideo: videoBlob.size < 1000,
          videoDuration: recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0
        }).catch(err => console.error('Failed to track video capture:', err));
      }
      
      // Complete processing
      setProcessingPhase('complete');
      setIsStoppingRecording(false);
      
      // Transition to preview stage
      console.log('Transitioning to preview stage');
      setStage('preview');
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      // Track the error if analytics is available
      if (analyticsId) {
        trackBoothEvent(analyticsId, 'error', {
          type: 'recording_error',
          message: error instanceof Error ? error.message : String(error)
        }).catch(err => console.error('Failed to track recording error:', err));
      }
      
      createFallbackVideo();
      setIsStoppingRecording(false);
    }
  };

  // Handle photo or video retake
  const handleRetake = async () => {
    setPhotoDataUrl(null);
    setVideoUrl(null); // Reset video URL
    
    // Go back to filter selection if filters are enabled, otherwise to countdown
    if (isFiltersEnabled) {
      setStage('select-filter');
    } else {
      setStage('countdown');
    }
    
    // Track retake with media type info
    if (analyticsId) {
      await trackBoothEvent(analyticsId, safeMode === 'photo' ? 'retake_photo' : 'retake_video', {
        mediaType: safeMode,
        captureMode: safeMode
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
      
      // Add event URL information if available
      if (eventUrlId) {
        formData.append('eventUrlId', eventUrlId);
      }
      
      // Add analytics ID if available
      if (analyticsId) {
        formData.append('analyticsId', analyticsId);
      }
      
      // Track media approved
      if (analyticsId) {
        await trackBoothEvent(analyticsId, safeMode === 'photo' ? 'photo_approved' : 'video_approved', {
          ...(safeMode === 'video' ? {
            duration: recordingStartTime ? Math.floor((Date.now() - recordingStartTime) / 1000) : 0,
            resolution: videoResolution,
          } : {}),
          captureMode: safeMode,
          eventUrlId: eventUrlId || null
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
          eventUrlId: eventUrlId || null
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
            mediaType: safeMode,
            eventUrlId: eventUrlId || null
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
          eventUrlId: eventUrlId || null
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
  const handleSendVideoEmail = async (): Promise<void> => {
    if (!userData) {
      console.error('User data is not available');
      return;
    }

    try {
      setIsProcessingEmail(true);
      
      // Get video blob using getRecordedBlob method from the canvas recorder if available
      let videoBlob: Blob | null = null;
      
      if (canvasRecorderRef.current) {
        videoBlob = canvasRecorderRef.current.getRecordedBlob();
      }
      
      // Fall back to videoUrl if we don't have a blob from the recorder
      if (!videoBlob && videoUrl) {
        // Convert URL to blob
        const response = await fetch(videoUrl);
        videoBlob = await response.blob();
      }
      
      if (!videoBlob) {
        console.error('No video blob available');
        setIsProcessingEmail(false);
        return;
      }

      // Generate session ID if not already set
      const currentSessionId = sessionId || uuidv4();
      if (!sessionId) {
        setSessionId(currentSessionId);
      }
      
      // Log basic information about the request
      console.log(`------- VIDEO EMAIL REQUEST -------
User Name: ${userData.name}
Session ID: ${currentSessionId}
User Email: ${userData.email}
Preview WebM URL: ${videoUrl}
Event URL ID: ${eventUrlId || 'none'}
      `);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', videoBlob, 'recording.webm');
      formData.append('email', userData.email);
      formData.append('name', userData.name);
      formData.append('sessionId', currentSessionId);
      
      // Add event URL information if available
      if (eventUrlId) {
        formData.append('eventUrlId', eventUrlId);
        formData.append('eventUrlPath', ''); // We don't have this in props currently
      }
      
      // Add analytics ID if available
      if (analyticsId) {
        formData.append('analyticsId', analyticsId);
      }
      
      // Set stage to complete with processing message
      setStage('complete');
      
      // Start reset timer
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      
      resetTimerRef.current = setTimeout(() => {
        resetBooth();
      }, resetTimeSeconds * 1000);
      
      // Track video approved in analytics
      if (analyticsId) {
        await trackBoothEvent(analyticsId, 'video_approved');
      }
      
      // Upload video for processing - should return immediately with acknowledgment
      const response = await fetch('/api/send-video-email', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Log the response including final MP4 URL when available
        console.log(`Final MP4 URL: ${responseData.mp4Url || 'Processing'}
          Email Sent: ${responseData.emailSent ? 'Successful' : 'Pending'}
        `);

        // Track email sent event only if it was actually sent immediately
        if (responseData.emailSent && analyticsId) {
          await trackBoothEvent(analyticsId, 'email_sent');
        }
      } else {
        console.error('Failed to send video', await response.text());
        console.log('Email Sent: Failed');
        
        setError({
          title: 'Processing Error',
          message: 'We encountered an issue while processing your video. Please try again.'
        });
      }
      
      setIsProcessingEmail(false);
    } catch (error) {
      console.error('Error sending video:', error);
      console.log('Email Sent: Failed');
      
      setIsProcessingEmail(false);
      setError({
        title: 'Processing Error',
        message: error instanceof Error ? error.message : 'Failed to process video. Please try again.'
      });
    }
  };

  // Reset the booth to initial state
  const resetBooth = () => {
    setStage(isSplashPageEnabled ? 'splash' : 'collect-info');
    
    // Clean up object URLs before resetting state
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (photoDataUrl) {
      // photoDataUrl is a data URL not an object URL, so no need to revoke
    }
    
    // Reset user data and other state
    setUserData(null);
    setSessionId(null);
    setPhotoDataUrl(null);
    setVideoUrl(null);
    setJourneyCompleted(false);
    setSelectedFilter('normal'); // Reset selected filter
    
    // Reset processing state
    setIsProcessingVideo(false);
    setProcessingProgress(0);
    setProcessingPhase('waiting');
    
    // Clean up canvas recorder
    if (canvasRecorderRef.current) {
      try {
        canvasRecorderRef.current.stopRecording().catch(e => {
          console.error('Error stopping canvas recorder during reset:', e);
        });
      } catch (e) {
        console.error('Error with canvas recorder during reset:', e);
      }
      canvasRecorderRef.current = null;
    }
    
    // Clean up any animation frames
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear any recorded chunks
    recordedChunksRef.current = [];
    
    // Reset recording state
    setIsRecording(false);
    setIsStoppingRecording(false);
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
      
      // Clean up any created object URLs
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

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

  // Photo capture settings - enhanced for better quality
  const photoSettings = {
    // Higher quality JPEG compression (0.95 instead of 0.92)
    quality: 0.95,
    // Screenshot dimensions based on photo resolution setting
    dimensions: photoResolution === 'high' ? { width: 1920, height: 1080 } :
                photoResolution === 'medium' ? { width: 1280, height: 720 } :
                { width: 640, height: 360 }
  };

  // Helper function to apply overlay to captured photo
  const applyOverlayToPhoto = (baseImageSrc: string, overlayImageSrc: string = '/overlay.png'): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(baseImageSrc); // Fallback to original if canvas not available
        return;
      }

      const baseImage = new Image();
      const overlayImage = new Image();
      let imagesLoaded = 0;

      const checkComplete = () => {
        imagesLoaded++;
        if (imagesLoaded === 2) {
          // Set canvas dimensions to match photo settings
          canvas.width = photoSettings.dimensions.width;
          canvas.height = photoSettings.dimensions.height;
          
          // Enable high-quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw base image (photo) scaled to canvas size
          ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
          
          // Draw overlay image on top, scaled to canvas size
          ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
          
          // Convert to high-quality data URL
          const compositeDataUrl = canvas.toDataURL('image/jpeg', photoSettings.quality);
          resolve(compositeDataUrl);
        }
      };

      baseImage.onload = checkComplete;
      overlayImage.onload = checkComplete;
      
      // Handle overlay load error - continue without overlay
      overlayImage.onerror = () => {
        console.warn('Could not load overlay image, using photo without overlay');
        resolve(baseImageSrc);
      };

      baseImage.src = baseImageSrc;
      overlayImage.src = overlayImageSrc;
    });
  };

  // Create analytics session ID if not already created
  useEffect(() => {
    if (!analyticsId) {
      setAnalyticsId(uuidv4());
    }
  }, [analyticsId]);
  
  // Parse any enabled filters
  const enabledFiltersArray = useMemo(() => {
    if (!enabledFilters) return ['normal'];
    try {
      return typeof enabledFilters === 'string' ? enabledFilters.split(',') : ['normal'];
    } catch (e) {
      console.error('Error parsing enabled filters:', e);
      return ['normal'];
    }
  }, [enabledFilters]);

  // Listen for keyboard shortcuts
  useEffect(() => {
    // Add your keyboard shortcut handling logic here
    const handleKeyDown = (e: KeyboardEvent) => {
      // Example: Reset booth on Escape key
      if (e.key === 'Escape') {
        resetBooth();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Render different stages
  const renderStage = () => {
    // Add compatibility warning at the top of the content if needed
    const renderCompatibilityWarning = () => {
      if (compatibilityWarning) {
        return (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 text-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p>{compatibilityWarning}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setCompatibilityWarning(null)}
                    className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-200 focus:outline-none"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      return null;
    };
    
    // Add warning banner to content
    const withCompatibilityWarning = (content: React.ReactNode) => {
      return (
        <>
          {renderCompatibilityWarning()}
          {content}
        </>
      );
    };

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
          if (isCJEnabled && !journeyCompleted) {
            console.log('Rendering custom journey with', journeyPages?.length, 'pages');
            
            // Log journey pages for debugging
            if (journeyPages?.length > 0) {
              console.log('Journey pages available:', journeyPages.map(p => p.title).join(', '));
            } else {
              console.log('No journey pages found even though customJourneyEnabled is true');
            }
            
            // Only render journey if we have pages
            if (journeyPages && journeyPages.length > 0) {
              return (
                <JourneyContainer
                  pages={journeyPages}
                  primaryColor={themeSettings.primaryColor}
                  buttonColor={themeSettings.buttonColor}
                  onComplete={handleJourneyComplete}
                  analyticsId={analyticsId}
                />
              );
            } else {
              // If no journey pages but journey enabled, log and skip to next stage
              console.log('Skipping empty journey - no pages defined');
              
              // Auto-complete the journey since there's nothing to show
              setTimeout(() => {
                handleJourneyComplete();
              }, 0);
              
              // Show loading indicator briefly
              return (
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
                  <div className="animate-pulse flex flex-col items-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-blue-400 mb-4"></div>
                    <div className="h-4 w-32 rounded mb-2"></div>
                    <div className="h-3 w-24 rounded"></div>
                    <p className="mt-4 text-gray-500 text-sm">Loading journey...</p>
                  </div>
                </div>
              );
            }
          }
          
          // If journey is disabled or completed, move to next stage
          if (isFiltersEnabled) {
            // Create a simple array of filter IDs from the comma-separated list
            const filterIds = enabledFilters 
              ? enabledFilters.split(',') 
              : ['normal'];
              
            return <FiltersSelector 
              enabledFilters={filterIds}
              onSelectFilter={handleFilterSelect}
              onConfirm={handleFilterConfirm}
              selectedFilter={selectedFilter}
              videoElement={webcamRef.current?.video || null}
            />;
          }
          
          return withCompatibilityWarning(
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-bold mb-4">Ready to capture!</h2>
                <button
                  className="px-6 py-3 rounded-lg text-white font-medium"
                  style={{ backgroundColor: themeSettings.buttonColor || '#3B82F6' }}
                  onClick={() => setStage('countdown')}
                >
                  Start
                </button>
              </div>
            </div>
          );
        
          case 'select-filter':
            return (
              <div className="relative">
                <div className="aspect-video bg-black rounded overflow-hidden relative">
                  <Webcam
                    audio={safeMode === 'video'}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={photoSettings.quality}
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
                  
                  {/* Photo overlay - positioned above camera but below UI elements */}
                  {safeMode === 'photo' && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <img 
                        src="/overlay.png" 
                        alt="Photo overlay" 
                        className="w-full h-full object-cover"
                        style={{ mixBlendMode: 'normal' }}
                      />
                    </div>
                  )}
                  
                  <div className="relative z-20">
                    <FiltersSelector
                      enabledFilters={parsedFilters}
                      onSelectFilter={handleFilterSelect}
                      onConfirm={handleFilterConfirm}
                      selectedFilter={selectedFilter}
                      videoElement={videoElement}
                    />
                  </div>
                </div>
              </div>
            );
        
          case 'countdown':
            return (
              <div className="relative">
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <Webcam
                    audio={safeMode === 'video'} // Enable audio for video recording
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    screenshotQuality={photoSettings.quality}
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                    mirrored={true}
                    onUserMediaError={() => setIsCameraError(true)}
                  />
                  
                  {/* Photo overlay - positioned above camera but below UI elements */}
                  {safeMode === 'photo' && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <img 
                        src="/overlay.png" 
                        alt="Photo overlay" 
                        className="w-full h-full object-cover"
                        style={{ mixBlendMode: 'normal' }}
                      />
                    </div>
                  )}
                  
                  {/* Recording indicator - only shown when video is recording */}
                  {safeMode === 'video' && isRecording && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-1 rounded-full text-white">
                      <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
                      <span className="font-medium">REC</span>
                      <span className="ml-2">{remainingTime}s</span>
                    </div>
                  )}
                  
                  {/* Control buttons */}
                  <div className="absolute bottom-4 left-4 z-20">
                    {/* "I'm Done" button - only shown when recording */}
                    {safeMode === 'video' && isRecording && (
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
                <div className="absolute inset-0 flex items-center justify-center z-30">
                  {/* Only show countdown if we're not recording, not stopping recording, and no video URL exists */}
                  {!(safeMode === 'video' && (isRecording || isStoppingRecording)) && !videoUrl && (
                    <CountdownTimer
                      seconds={countdownSeconds}
                      onComplete={handleCountdownComplete}
                      onCancel={() => setStage('collect-info')}
                    />
                  )}
                  
                  {/* Show processing message when stopping recording */}
                  {isStoppingRecording && (
                    <div className="bg-black bg-opacity-70 rounded-lg p-6 text-white text-center max-w-xs">
                      <div className="mb-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                      <p className="text-lg font-medium">Finalizing video...</p>
                      <p className="text-sm opacity-80 mt-1">Please wait</p>
                    </div>
                  )}
                </div>
              </div>
            );
        
            case 'preview':
              return userData && (safeMode === 'photo' ? photoDataUrl : videoUrl) ? (
                withCompatibilityWarning(
                  <>
                    {error && (
                      <ErrorMessage
                        title={error.title}
                        message={error.message}
                        onRetry={() => setError(null)}
                        className="mb-4"
                      />
                    )}
                    {safeMode === 'photo' ? (
                      <PhotoPreview
                        photoDataUrl={photoDataUrl as string}
                        userName={userData.name}
                        userEmail={userData.email}
                        onSendEmail={handleSendEmail}
                        onRetake={handleRetake}
                      />
                    ) : isProcessingVideo ? (
                      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold mb-2">Processing Video</h3>
                          <p className="text-gray-600">
                            {processingPhase === 'processing'
                              ? `Applying ${AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.name || 'selected'} filter...`
                              : 'Finalizing video...'}
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
                    ) : (
                      <VideoPreview
                        videoUrl={videoUrl as string}
                        userName={userData.name}
                        userEmail={userData.email}
                        onSendEmail={handleSendVideoEmail}
                        onRetake={handleRetake}
                        isProcessing={isProcessingEmail}
                      />
                    )}
                  </>
                )
              ) : (
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
                  <div className="text-center space-y-4 max-w-md mx-auto">
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
                </div>
              );
        
      case 'complete':
        return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-6 max-w-md mx-auto">
              <div className="text-3xl text-green-600 mb-4">Thank You!</div>
              <p className="mb-8">
                {safeMode === 'photo' 
                  ? "Your photo has been sent to your email."
                  : "You will receive an email with a download link for your video as soon as it is prepared for you!"}
                <br />
                This booth will reset in {resetTimeSeconds} seconds.
              </p>
              <button
                onClick={resetBooth}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start Over
              </button>
            </div>
          </div>
        );
    }
  };

  if (isCameraError) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <div className="text-center text-red-600 space-y-4 max-w-md mx-auto">
          <p className="text-xl font-bold mb-2">Camera Error</p>
          <p>Failed to access camera. Please ensure camera access is granted and try refreshing the page.</p>
          <p className="mt-4 text-sm">
            Please ensure camera access is granted and try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="photo-booth" 
      style={{ 
        backgroundColor: themeSettings.backgroundColor || '#e6d7c3',
        color: '#111827', // Force black text
        minHeight: '100vh',
        padding: '1rem'
      }}
    >
      {renderStage()}
    </div>
  );
};

export default PhotoBooth;