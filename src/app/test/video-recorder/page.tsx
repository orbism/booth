'use client';

import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CanvasVideoRecorder } from '@/lib/canvas-video-recorder';

export default function CanvasRecorderTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterName, setFilterName] = useState<string>('normal');
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const webcamRef = useRef<Webcam>(null);
  const recorderRef = useRef<CanvasVideoRecorder | null>(null);
  
  // Available filters for testing
  const filters = [
    { id: 'normal', name: 'Normal', css: '' },
    { id: 'grayscale', name: 'Grayscale', css: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
    { id: 'blur', name: 'Blur', css: 'blur(5px)' },
    { id: 'invert', name: 'Invert', css: 'invert(100%)' },
    { id: 'saturate', name: 'Saturate', css: 'saturate(200%)' },
  ];
  
  // Add log message
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)}: ${message}`]);
  };
  
  // Start recording
  const startRecording = async () => {
    if (!webcamRef.current || !webcamRef.current.video) {
      setError('Webcam not available');
      return;
    }
    
    try {
      setError(null);
      setLogs([]);
      addLog('Starting recording...');
      
      // Get the selected filter
      const selectedFilter = filters.find(f => f.id === filterName);
      
      // Create recorder instance
      const recorder = new CanvasVideoRecorder({
        filterCss: selectedFilter?.css,
        maxDuration: 10, // 10 second max
        onProgress: (prog) => {
          setProgress(prog);
        },
        onError: (err) => {
          addLog(`Error: ${err.message}`);
          setError(err.message);
        },
        onFilterError: (message) => {
          addLog(`Filter error: ${message}`);
        }
      });
      
      recorderRef.current = recorder;
      
      // Start recording
      await recorder.startRecording(webcamRef.current.video);
      setIsRecording(true);
      addLog(`Recording started with filter: ${selectedFilter?.name || 'none'}`);
      
    } catch (err) {
      setError(`Failed to start recording: ${err instanceof Error ? err.message : String(err)}`);
      addLog(`Start recording error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    if (!recorderRef.current) {
      setError('No active recorder');
      return;
    }
    
    try {
      addLog('Stopping recording...');
      const blob = await recorderRef.current.stopRecording();
      
      // If we got a blob, create a URL for playback
      if (blob) {
        addLog(`Recording stopped, blob size: ${blob.size} bytes`);
        
        // Clean up any previous URL
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
        
        // Create new URL
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } else {
        addLog('No blob received');
        setError('No recorded data received');
      }
    } catch (err) {
      setError(`Failed to stop recording: ${err instanceof Error ? err.message : String(err)}`);
      addLog(`Stop recording error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRecording(false);
      recorderRef.current = null;
    }
  };
  
  // Download recorded video
  const downloadVideo = () => {
    if (!videoUrl) return;
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `recording-${filterName}-${new Date().getTime()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Canvas Video Recorder Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error: </strong> {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="bg-black relative rounded overflow-hidden aspect-video mb-4">
            <Webcam
              audio={true}
              ref={webcamRef}
              className="w-full h-full object-cover"
              videoConstraints={{
                width: 1280,
                height: 720,
                facingMode: "user"
              }}
            />
            
            {isRecording && (
              <div className="absolute top-2 left-2 flex items-center bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                <div className="w-3 h-3 rounded-full bg-red-600 mr-2 animate-pulse"></div>
                <span>Recording... {progress}%</span>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Select Filter:</label>
            <select 
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="border p-2 rounded w-full"
              disabled={isRecording}
            >
              {filters.map(filter => (
                <option key={filter.id} value={filter.id}>
                  {filter.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!webcamRef.current || isRecording}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Stop Recording
              </button>
            )}
          </div>
        </div>
        
        <div>
          {videoUrl ? (
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Preview</h2>
              <video 
                src={videoUrl} 
                controls 
                className="w-full rounded"
              />
              <button
                onClick={downloadVideo}
                className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Download Video
              </button>
            </div>
          ) : (
            <div className="bg-gray-100 rounded h-48 flex items-center justify-center text-gray-500">
              Recording will appear here
            </div>
          )}
          
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Logs</h2>
            <div className="bg-gray-800 text-green-300 p-3 rounded h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 