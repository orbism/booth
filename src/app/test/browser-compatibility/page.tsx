'use client';

import { useState, useEffect } from 'react';
import { detectCanvasCapabilities, getBrowserRecommendations, detectMediaRecorderSupport } from '@/lib/browser-compatibility';
import { CanvasVideoRecorder, CanvasRecorderOptions } from '@/lib/canvas-video-recorder';

export default function BrowserCompatibilityTest() {
  const [capabilities, setCapabilities] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('none');
  const [error, setError] = useState<string | null>(null);
  const [supportedMimeTypes, setSupportedMimeTypes] = useState<string[]>([]);

  useEffect(() => {
    const detectCapabilities = async () => {
      try {
        const caps = await detectCanvasCapabilities();
        setCapabilities(caps);
        setRecommendations(getBrowserRecommendations(caps));
        
        // Get supported MIME types separately
        const { mimeTypes } = detectMediaRecorderSupport();
        setSupportedMimeTypes(mimeTypes);
      } catch (err) {
        setError(`Error detecting capabilities: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    detectCapabilities();
  }, []);

  const startRecording = async () => {
    setError(null);
    setVideoUrl(null);
    
    try {
      const videoElement = document.getElementById('webcam') as HTMLVideoElement;
      if (!videoElement || !videoElement.srcObject) {
        throw new Error('Webcam not available');
      }
      
      const recorder = new CanvasVideoRecorder({
        filterCss: filterType !== 'none' ? `${filterType}(${getFilterValue(filterType)})` : '',
        width: 640,
        height: 480,
        onError: (err) => setError(`Recording error: ${err.message}`),
        onFilterError: (err) => setError(`Filter error: ${err}`),
      });
      
      setRecording(true);
      
      // Start recording first
      await recorder.startRecording(videoElement);
      
      // Then set the timeout to stop recording after it's started
      setTimeout(async () => {
        try {
          const blob = await recorder.stopRecording();
          setVideoUrl(URL.createObjectURL(blob));
          setRecording(false);
        } catch (err) {
          setError(`Failed to stop recording: ${err instanceof Error ? err.message : String(err)}`);
          setRecording(false);
        }
      }, 5000); // Record for 5 seconds
    } catch (err) {
      setError(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`);
      setRecording(false);
    }
  };

  const getFilterValue = (filter: string): string => {
    switch (filter) {
      case 'blur':
        return '5px';
      case 'brightness':
        return '1.5';
      case 'contrast':
        return '150%';
      case 'grayscale':
      case 'sepia':
        return '100%';
      case 'hue-rotate':
        return '90deg';
      default:
        return '';
    }
  };

  const startWebcam = async () => {
    try {
      const videoElement = document.getElementById('webcam') as HTMLVideoElement;
      if (!videoElement) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoElement.srcObject = stream;
      await videoElement.play();
    } catch (err) {
      setError(`Webcam access error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  useEffect(() => {
    startWebcam();
    return () => {
      const videoElement = document.getElementById('webcam') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Browser Compatibility Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Browser Capabilities</h2>
          {capabilities ? (
            <div className="bg-gray-100 p-4 rounded">
              <p><strong>Browser:</strong> {capabilities.browser.name} {capabilities.browser.version}</p>
              <p><strong>Canvas API:</strong> {capabilities.canvasSupported ? '✅' : '❌'}</p>
              <p><strong>Canvas 2D API:</strong> {capabilities.canvas2dSupported ? '✅' : '❌'}</p>
              <p><strong>Canvas Filters:</strong> {capabilities.filtersSupported ? '✅' : '❌'}</p>
              <p><strong>MediaRecorder API:</strong> {capabilities.mediaRecorderSupported ? '✅' : '❌'}</p>
              <p><strong>Supported Video MIME Types:</strong></p>
              <ul className="list-disc ml-6">
                {supportedMimeTypes.map((type: string) => (
                  <li key={type}>{type}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Detecting capabilities...</p>
          )}
          
          {recommendations.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Recommendations</h2>
              <ul className="list-disc ml-6">
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Canvas Recording Test</h2>
          <div className="mb-4">
            <label className="block mb-2">Filter Type:</label>
            <select 
              className="border rounded p-2 w-full"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={recording}
            >
              <option value="none">None</option>
              <option value="blur">Blur</option>
              <option value="grayscale">Grayscale</option>
              <option value="sepia">Sepia</option>
              <option value="brightness">Brightness</option>
              <option value="contrast">Contrast</option>
              <option value="hue-rotate">Hue Rotate</option>
            </select>
          </div>
          
          <div className="flex flex-col items-center mb-4">
            <video 
              id="webcam" 
              className="w-full border rounded mb-2" 
              muted 
              playsInline
            />
            
            <button 
              onClick={startRecording}
              disabled={recording}
              className={`px-4 py-2 rounded ${recording 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {recording ? 'Recording...' : 'Record 5-Second Video'}
            </button>
          </div>
          
          {videoUrl && (
            <div>
              <h3 className="text-lg font-medium mb-2">Recorded Video</h3>
              <video 
                src={videoUrl} 
                className="w-full border rounded" 
                controls
              />
              <a 
                href={videoUrl} 
                download="test-recording.webm"
                className="inline-block mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Download Video
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 