// src/components/booth/PhotoPreview.tsx

import React, { useState } from 'react';
import Image from 'next/image';


interface PhotoPreviewProps {
  photoDataUrl: string;
  userName: string;
  userEmail: string;
  onSendEmail: () => Promise<void>;
  onRetake: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  photoDataUrl,
  userName,
  userEmail,
  onSendEmail,
  onRetake,
}) => {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendEmail = async () => {
    try {
      setIsSending(true);
      setError(null);
      await onSendEmail();
      setIsSent(true);
    } catch (err) {
      setError('Failed to send email. Please try again.');
      console.error('Email sending error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">Your Photo</h2>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative border-4 border-blue-500 rounded shadow-lg overflow-hidden">
          <div className="relative w-full aspect-video">
            <Image
              src={photoDataUrl}
              alt="Your captured photo"
              fill
              className="object-contain"
              unoptimized={true} // using data URL
            />
          </div>
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
              disabled={isSending}
            >
              Retake Photo
            </button>
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send to Email'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-4 text-green-600 font-semibold">
              Email sent successfully!
            </div>
            <p className="text-gray-600">
              Your photo has been sent to {userEmail}.<br />
              The booth will reset in a few seconds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPreview;