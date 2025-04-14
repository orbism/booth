// src/hooks/useCamera.ts

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraProps {
  onPhotoCapture?: (photoDataUrl: string) => void;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  photoDataUrl: string | null;
  isLoading: boolean;
  error: string | null;
  isCameraReady: boolean;
  takePhoto: () => void;
  resetPhoto: () => void;
}

export function useCamera({ onPhotoCapture }: UseCameraProps = {}): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Initialize camera
  useEffect(() => {
    let mounted = true;
    console.log('🎥 Camera hook effect running');

    async function setupCamera() {
      try {
        console.log('🎥 Setting up camera...');
        setIsLoading(true);
        setError(null);
  
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser does not support camera access');
        }
  
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        console.log('🎥 Camera stream obtained', {
          videoRefExists: !!videoRef.current,
          streamRefExists: !!streamRef.current,
          tracks: streamRef.current?.getTracks().map(t => t.kind) || []
        });
        streamRef.current = stream;
        console.log('🎥 Stream ref updated', {
          streamRefExists: !!streamRef.current,
          tracks: streamRef.current?.getTracks().map(t => t.kind) || []
        });

        if (videoRef.current) {
          console.log('🎥 Video ref exists, attaching stream directly');
          videoRef.current.srcObject = stream;
          
          // Force the video to play immediately
          videoRef.current.play()
            .then(() => {
              console.log('🎥 Direct video play successful');
              setIsLoading(false);
              setIsCameraReady(true);
            })
            .catch(err => {
              console.error('🎥 Direct video play failed:', err);
            });
        } else {
          console.log('🎥 Video ref still does not exist, will rely on second effect');
        }
        setIsSetupComplete(true);
        
        if (!mounted) {
          console.log('🎥 Component unmounted during setup, cleaning up');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        setIsSetupComplete(true);
      } catch (err) {
        console.error('🎥 Camera error:', err);
        if (mounted) {
          setIsLoading(false);
          setError('Failed to access camera: ' + (err instanceof Error ? err.message : String(err)));
        }
      }
    }

    setupCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        console.log('🎥 Cleaning up camera stream');
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isSetupComplete, videoRef.current]);

  useEffect(() => {
    // Only proceed if we have both a stream and a video element
    if (isSetupComplete && videoRef.current && streamRef.current) {
      console.log('🎥 Attaching stream to video element');

      console.log('🎥 Second effect running', {
        isSetupComplete,
        videoRefExists: !!videoRef.current,
        streamRefExists: !!streamRef.current
      });
      
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        console.log('🎥 Video metadata loaded, playing');
        videoRef.current?.play()
          .then(() => {
            console.log('🎥 Video playing successfully');
            setIsLoading(false);
            setIsCameraReady(true);
          })
          .catch(err => {
            console.error('🎥 Video play error:', err);
            setError('Failed to play video: ' + err.message);
          });
      };
    }
  }, [isSetupComplete, videoRef.current]);

  // Take photo
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !isCameraReady) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip the image horizontally (mirror effect)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setPhotoDataUrl(dataUrl);
      
      if (onPhotoCapture) {
        onPhotoCapture(dataUrl);
      }
    }
  }, [isCameraReady, onPhotoCapture]);

  // Reset photo
  const resetPhoto = useCallback(() => {
    setPhotoDataUrl(null);
  }, []);

  return {
    videoRef,
    photoDataUrl,
    isLoading,
    error,
    isCameraReady,
    takePhoto,
    resetPhoto,
  };
}