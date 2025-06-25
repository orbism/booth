// src/components/booth/VideoPreview.tsx
import React, { useState, useEffect, useRef } from 'react';

interface VideoPreviewProps {
  videoUrl: string;
  userName: string;
  userEmail: string;
  onSendEmail: () => Promise<void>;
  onRetake: () => void;
  isProcessing?: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  userName,
  userEmail,
  onSendEmail,
  onRetake,
  isProcessing = false,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Log when video URL changes
  useEffect(() => {
    console.log('VideoPreview: Video URL updated:', videoUrl);
  }, [videoUrl]);
  
  // Monitor video load status
  useEffect(() => {
    if (!videoRef.current) return;
    
    const handleVideoLoad = () => {
      console.log('VideoPreview: Video loaded successfully');
      setVideoLoaded(true);
    };
    
    const handleVideoError = (e: Event) => {
      console.error('VideoPreview: Error loading video:', e);
      setError('Failed to load video. Please try again.');
    };
    
    videoRef.current.addEventListener('loadeddata', handleVideoLoad);
    videoRef.current.addEventListener('error', handleVideoError);
    
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadeddata', handleVideoLoad);
        videoRef.current.removeEventListener('error', handleVideoError);
      }
    };
  }, [videoRef.current]);

  const handleSendEmail = async () => {
    try {
      console.log('VideoPreview: Sending email with video');
      setIsSending(true);
      setError(null);
      await onSendEmail();
      console.log('VideoPreview: Email sent successfully');
      setIsSent(true);
    } catch (err) {
      console.error('VideoPreview: Email sending error:', err);
      setError('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="space-y-6 w-full max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center">Your Video</h2>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="relative border-4 border-blue-500 rounded shadow-lg overflow-hidden mt-8">
            {!videoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            )}
            <video 
              ref={videoRef}
              src={videoUrl} 
              className="max-w-full h-auto" 
              controls 
              autoPlay
              style={{ maxHeight: '60vh' }}
              onLoadedData={() => setVideoLoaded(true)}
            />
          </div>
          
          <div className="text-center">
            <p className="text-gray-700">
              Name: <span className="font-semibold">{userName}</span>
            </p>
            <p className="text-gray-700">
              Email: <span className="font-semibold">{userEmail}</span>
            </p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div className="flex justify-center space-x-4">
          {!isSent ? (
            <>
              <button
                onClick={onRetake}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                disabled={isSending || isProcessing}
              >
                Retake Video
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={isSending || !videoLoaded || isProcessing}
              >
                {isProcessing 
                  ? 'Converting video...' 
                  : isSending 
                    ? 'Sending...' 
                    : videoLoaded 
                      ? 'Send to Email' 
                      : 'Loading video...'}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4 text-green-600 font-semibold">
                Email sent successfully!
              </div>
              <p className="text-gray-600">
                Your video has been sent to {userEmail}.<br />
                The booth will reset in a few seconds.
              </p>
            </div>
          )}
        </div>
        
        {isProcessing && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <div className="mb-4">
                <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-medium">Converting your video...</p>
              <p className="text-sm text-gray-500 mt-2">Please wait, this may take a moment.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;