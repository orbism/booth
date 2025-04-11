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

  // Initialize camera
  useEffect(() => {
    async function setupCamera() {
      try {
        setIsLoading(true);
        setError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false);
            setIsCameraReady(true);
          };
        }
      } catch (err) {
        setIsLoading(false);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
        console.error('Camera error:', err);
      }
    }

    setupCamera();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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