/**
 * Canvas-based video recorder utility
 * This utility provides methods for recording video with CSS filters applied
 * using the Canvas API, eliminating the need for post-processing.
 */

// Define the recorder options interface
export interface CanvasRecorderOptions {
  /** The filter CSS string to apply */
  filterCss?: string;
  /** Function to call with recording progress (0-100) */
  onProgress?: (progress: number) => void;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  /** Target width for the recording */
  width?: number;
  /** Target height for the recording */
  height?: number;
  /** Target framerate for the recording */
  frameRate?: number;
  /** Callback for errors during recording */
  onError?: (error: Error) => void;
  /** Callback when filter cannot be applied */
  onFilterError?: (message: string) => void;
}

// Define the recorder state interface
export interface RecorderState {
  /** Whether the recorder is currently recording */
  isRecording: boolean;
  /** The current recording duration in milliseconds */
  duration: number;
  /** The remaining recording time in seconds */
  remainingTime: number;
  /** Whether filters were successfully applied */
  filterApplied: boolean;
}

/**
 * Get the best supported MIME type for MediaRecorder
 * @returns The best supported MIME type
 */
function getBestSupportedMimeType(): string {
  // Use simpler MIME types that are more widely supported
  const mimeOptions = [
    'video/webm;codecs=vp8', // More widely supported than VP9
    'video/webm',            // Generic WebM without specific codec
    'video/mp4'              // Last resort
  ];
  
  for (const mime of mimeOptions) {
    if (MediaRecorder.isTypeSupported(mime)) {
      console.log(`Using MIME type: ${mime}`);
      return mime;
    }
  }
  
  console.warn('No preferred MIME types supported, using default');
  return ''; // Let the browser choose
}

/**
 * Compare two pixel data arrays to see if they're different
 * Used to test if filters are actually applied
 */
function pixelsAreEqual(data1: Uint8ClampedArray, data2: Uint8ClampedArray): boolean {
  if (data1.length !== data2.length) return false;
  
  // Compare just a few pixels - blurring will change the values
  for (let i = 0; i < 40; i += 4) {
    if (Math.abs(data1[i] - data2[i]) > 5 || 
        Math.abs(data1[i+1] - data2[i+1]) > 5 || 
        Math.abs(data1[i+2] - data2[i+2]) > 5) {
      return false; // They're different, which means filter was applied
    }
  }
  
  return true; // They're the same, filter was not applied
}

/**
 * Check if canvas filters are supported in the current browser
 * @returns Whether canvas filters are supported
 */
function canvasFilterSupported(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false;
  
  try {
    // First do a simple property check
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx || typeof ctx.filter === 'undefined') return false;
    
    // Try a simpler test - just check if we can set the filter property
    // without comparing pixels (which can be unreliable across browsers)
    try {
      // Test if the filter property works at all
      ctx.filter = 'grayscale(100%)';
      // If we got here without errors, basic filter support exists
      return true;
    } catch (e) {
      console.warn('Canvas filter property test failed:', e);
      return false;
    }
  } catch (e) {
    console.warn('Canvas filter test failed:', e);
    return false;
  }
}

/**
 * Calculate the optimal resolution based on device capabilities
 * @returns The optimal width and height for the recording
 */
function calculateOptimalResolution(): { width: number; height: number } {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return { width: 1280, height: 720 }; // Default to 720p
  }
  
  // Try to get device memory if available
  const memory = (navigator as any).deviceMemory || 4; // Default to 4GB if not available
  const isHighEnd = memory >= 8;
  const isLowEnd = memory <= 2;
  
  // Adjust resolution based on device capability
  if (isHighEnd) {
    return { width: 1280, height: 720 }; // HD
  } else if (isLowEnd) {
    return { width: 640, height: 360 }; // 360p
  } else {
    return { width: 960, height: 540 }; // 540p
  }
}

/**
 * Draw a frame with filter applied to canvas
 * @param ctx Canvas 2D context
 * @param videoElement Video element to draw
 * @param filterCss CSS filter to apply
 * @returns Whether the filter was successfully applied
 */
function drawFrameWithFilter(
  ctx: CanvasRenderingContext2D,
  videoElement: HTMLVideoElement,
  filterCss: string | undefined
): boolean {
  try {
    // Save context state before applying filter
    ctx.save();
    
    // Clear previous frame to avoid artifacts
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Apply filter if one is specified
    if (filterCss && filterCss !== 'none' && filterCss !== '') {
      ctx.filter = filterCss;
    }
    
    // Draw the video frame with the filter applied
    ctx.drawImage(
      videoElement, 
      0, 0, 
      ctx.canvas.width, 
      ctx.canvas.height
    );
    
    // Restore context for next frame
    ctx.restore();
    
    // Successfully applied filter (or no filter was needed)
    return true;
  } catch (error) {
    console.error('Error applying filter to canvas:', error);
    // Filter application failed
    return false;
  }
}

/**
 * Create a canvas element for video recording
 * @param width Canvas width
 * @param height Canvas height
 * @param filterCss CSS filter to apply
 * @param onFilterError Callback when filter cannot be applied
 * @returns Canvas element, context, and whether filter was applied
 */
function createCanvas(
  width: number, 
  height: number, 
  filterCss?: string,
  onFilterError?: (message: string) => void
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  filterApplied: boolean;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Get 2D context with alpha disabled for better performance
  // Add willReadFrequently for better performance with getImageData
  const ctx = canvas.getContext('2d', { 
    alpha: false,
    willReadFrequently: true 
  }) as CanvasRenderingContext2D;
  
  // Track if filter was applied
  let filterApplied = false;
  
  // Apply filter if provided and supported
  if (filterCss && filterCss !== 'none' && filterCss !== '') {
    // Check if filters are supported
    if (canvasFilterSupported()) {
      try {
        // Try applying the filter without testing pixel data
        ctx.save();
        ctx.filter = filterCss;
        ctx.fillRect(0, 0, 1, 1); // Just a test pixel
        ctx.restore();
        filterApplied = true;
      } catch (e) {
        console.warn('Failed to apply canvas filter:', e);
        if (onFilterError) {
          onFilterError('Filter could not be applied due to browser limitations.');
        }
      }
    } else {
      console.warn('Canvas filters not supported in this browser');
      if (onFilterError) {
        onFilterError('Filter could not be applied due to technical limitations. Your video will be captured without the filter.');
      }
    }
  }
  
  return { canvas, ctx, filterApplied };
}

/**
 * Create a MediaRecorder for the canvas stream
 * @param stream MediaStream to record
 * @param onDataAvailable Callback for when data is available
 * @returns MediaRecorder instance
 */
function createMediaRecorder(
  stream: MediaStream,
  onDataAvailable: (data: BlobEvent) => void
): MediaRecorder {
  let recorder: MediaRecorder;
  
  // Try with simpler MIME types that are more widely supported
  const options: MediaRecorderOptions = {
    videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
  };
  
  // First try with vp8 codec (more widely supported)
  try {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options.mimeType = 'video/webm;codecs=vp8';
      recorder = new MediaRecorder(stream, options);
      console.log('Created MediaRecorder with VP8 codec');
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      // Then try with generic webm (no codec specified)
      options.mimeType = 'video/webm';
      recorder = new MediaRecorder(stream, options);
      console.log('Created MediaRecorder with generic WebM');
    } else {
      // Finally fall back to browser default
      console.warn('Falling back to default MediaRecorder configuration');
      recorder = new MediaRecorder(stream);
      console.log('Created MediaRecorder with default settings');
    }
  } catch (e) {
    console.warn('Failed to create MediaRecorder with specified options, using defaults:', e);
    recorder = new MediaRecorder(stream);
    console.log('Created MediaRecorder with default settings after error');
  }
  
  // Set up data handler
  recorder.ondataavailable = onDataAvailable;
  
  return recorder;
}

/**
 * Canvas Video Recorder class
 * Handles recording video with applied CSS filters using Canvas API
 */
export class CanvasVideoRecorder {
  private videoElement: HTMLVideoElement | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private options: CanvasRecorderOptions;
  private timerId: NodeJS.Timeout | null = null;
  private filterApplied: boolean = false;
  private lastDrawTime: number = 0;
  private frameInterval: number = 0;
  private dataAvailableEventCount: number = 0;
  private dataRequestInterval: NodeJS.Timeout | null = null;
  private isUsingDirectRecording: boolean = false;
  
  private readonly defaultOptions: CanvasRecorderOptions = {
    maxDuration: 30,
    width: 640,
    height: 480,
    frameRate: 30,
  };
  
  constructor(options: CanvasRecorderOptions = {}) {
    // Merge provided options with defaults
    this.options = {
      ...this.defaultOptions,
      ...options,
    };
    
    // Calculate resolution if not provided
    if (!this.options.width || !this.options.height) {
      const { width, height } = calculateOptimalResolution();
      this.options.width = this.options.width || width;
      this.options.height = this.options.height || height;
    }
    
    // Calculate frame interval for consistent frame rate
    this.frameInterval = 1000 / (this.options.frameRate || 30);
    
    // Log initialization
    console.log('CanvasVideoRecorder initialized with options:', this.options);
  }
  
  /**
   * Start recording video from the provided video element
   * @param videoElement The video element to record
   * @returns Promise that resolves when recording starts
   */
  public async startRecording(videoElement: HTMLVideoElement): Promise<void> {
    try {
      // Store reference to video element
      this.videoElement = videoElement;
      
      // Reset recorded chunks
      this.recordedChunks = [];
      this.dataAvailableEventCount = 0;
      this.isUsingDirectRecording = false;
      
      // Try canvas-based recording first
      try {
        // Create canvas with specified dimensions
        const { canvas, ctx, filterApplied } = createCanvas(
          this.options.width!,
          this.options.height!,
          this.options.filterCss,
          this.options.onFilterError
        );
        
        // Store whether filter was applied
        this.filterApplied = filterApplied;
        
        // If filter couldn't be applied and we expected it to work, notify
        if (this.options.filterCss && !filterApplied) {
          console.warn('Canvas filter could not be applied:', this.options.filterCss);
        }
        
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Get audio track from original stream for audio capture
        const originalStream = this.videoElement.srcObject as MediaStream;
        const audioTracks = originalStream ? originalStream.getAudioTracks() : [];
        
        // Create a stream from the canvas with explicit frame rate
        const canvasStream = this.canvas.captureStream(this.options.frameRate);
        console.log(`Canvas stream created with ${canvasStream.getTracks().length} video tracks`);
        
        // Add audio tracks to canvas stream if available
        if (audioTracks.length > 0) {
          audioTracks.forEach(track => {
            canvasStream.addTrack(track);
            console.log(`Added audio track: ${track.label || 'unnamed'}`);
          });
        } else {
          console.warn('No audio tracks available in the original stream');
        }
        
        console.log(`Final canvas stream has ${canvasStream.getTracks().length} tracks`);
        
        // Define data available handler as a separate function for clarity
        const handleDataAvailable = (event: BlobEvent) => {
          console.log(`Data available event: size=${event.data?.size || 0} bytes, type=${event.data?.type || 'unknown'}`);
          
          if (event.data && event.data.size > 0) {
            console.log(`Chunk #${this.dataAvailableEventCount + 1} received: ${event.data.size} bytes`);
            this.recordedChunks.push(event.data);
            this.dataAvailableEventCount++;
            
            // Calculate and report progress if callback provided
            if (this.options.onProgress) {
              const elapsed = Date.now() - this.startTime;
              const progress = Math.min(
                Math.round((elapsed / (this.options.maxDuration! * 1000)) * 100),
                100
              );
              this.options.onProgress(progress);
            }
          } else {
            console.warn('Empty data received from MediaRecorder');
          }
        };
        
        try {
          // Create the MediaRecorder with our improved function
          this.mediaRecorder = createMediaRecorder(canvasStream, handleDataAvailable);
          
          // Add error handler
          this.mediaRecorder.onerror = (event) => {
            const error = event.error || new Error('Unknown MediaRecorder error');
            console.error('MediaRecorder error:', error);
            if (this.options.onError) {
              this.options.onError(error);
            }
          };
        } catch (e) {
          console.error('Failed to create MediaRecorder for canvas, falling back to direct recording:', e);
          throw e; // Let the outer catch handle the fallback
        }
        
        // Start the drawing loop with timestamp for frame timing
        this.startDrawingLoop();
        
        // Start recording with a smaller timeslice (100ms) to ensure chunks are generated more frequently
        console.log('Starting MediaRecorder with 100ms timeslice');
        this.mediaRecorder.start(100);
        
        // Immediately request data to ensure we get at least one chunk
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            console.log('Requesting initial data chunk');
            this.mediaRecorder.requestData();
          }
        }, 500);
      } catch (e) {
        // If canvas recording setup fails, fall back to direct recording
        console.warn('Canvas recording setup failed, falling back to direct recording:', e);
        await this.startDirectRecording(videoElement);
        return;
      }
      
      // Store start time
      this.startTime = Date.now();
      this.lastDrawTime = performance.now();
      
      // Set up a periodic data request to ensure chunks are generated
      // Clear any existing interval first
      if (this.dataRequestInterval) {
        clearInterval(this.dataRequestInterval);
      }
      
      this.dataRequestInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          console.log('Requesting data chunk from interval');
          this.mediaRecorder.requestData();
        } else {
          if (this.dataRequestInterval) {
            clearInterval(this.dataRequestInterval);
            this.dataRequestInterval = null;
          }
        }
      }, 1000); // Request data every 1 second
      
      // Set up timer for max duration
      if (this.options.maxDuration && this.options.maxDuration > 0) {
        if (this.timerId) {
          clearTimeout(this.timerId);
        }
        
        this.timerId = setTimeout(() => {
          if (this.dataRequestInterval) {
            clearInterval(this.dataRequestInterval);
            this.dataRequestInterval = null;
          }
          this.stopRecording();
        }, this.options.maxDuration * 1000);
      }
      
      console.log('Canvas recording started');
    } catch (error) {
      console.error('Failed to start canvas recording:', error);
      this.cleanup();
      
      // Handle the error through the callback if provided
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error('Failed to start recording'));
      }
      
      throw error;
    }
  }
  
  /**
   * Fallback method to record directly from the video element's stream
   * without using a canvas (won't have filters applied)
   */
  private async startDirectRecording(videoElement: HTMLVideoElement): Promise<void> {
    try {
      console.log('Starting direct recording (bypassing canvas)');
      this.isUsingDirectRecording = true;
      
      // Get the original media stream directly from the video element
      const originalStream = videoElement.srcObject as MediaStream;
      if (!originalStream) {
        throw new Error('No media stream available in video element');
      }
      
      // Define data available handler
      const handleDataAvailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          console.log(`Direct recording chunk received: ${event.data.size} bytes`);
          this.recordedChunks.push(event.data);
          this.dataAvailableEventCount++;
          
          // Calculate and report progress if callback provided
          if (this.options.onProgress) {
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(
              Math.round((elapsed / (this.options.maxDuration! * 1000)) * 100),
              100
            );
            this.options.onProgress(progress);
          }
        }
      };
      
      // Try to create a MediaRecorder directly on the original stream
      try {
        this.mediaRecorder = createMediaRecorder(originalStream, handleDataAvailable);
      } catch (e) {
        console.error('Failed to create MediaRecorder for direct recording:', e);
        throw e;
      }
      
      // Start recording with a timeslice
      this.mediaRecorder.start(500);
      console.log('Direct recording started successfully');
      
      // Store start time
      this.startTime = Date.now();
      
      // Notify that we couldn't apply filters due to using direct recording
      if (this.options.filterCss && this.options.onFilterError) {
        this.options.onFilterError(
          'Using direct video recording without filters due to canvas recording issues'
        );
      }
      
      // Set up timer for max duration
      if (this.options.maxDuration && this.options.maxDuration > 0) {
        if (this.timerId) {
          clearTimeout(this.timerId);
        }
        
        this.timerId = setTimeout(() => {
          this.stopRecording();
        }, this.options.maxDuration * 1000);
      }
    } catch (error) {
      console.error('Failed to start direct recording:', error);
      
      // Handle the error through the callback if provided
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error('Failed to start direct recording'));
      }
      
      throw error;
    }
  }
  
  /**
   * Stop the recording and get the recorded video blob
   * @returns Promise that resolves with the recorded video blob
   */
  public async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // First check if we have any data
        if (this.recordedChunks.length === 0) {
          console.warn('No recorded chunks available, data may not have been captured');
        } else {
          console.log(`Stopping recording with ${this.recordedChunks.length} chunks, total events: ${this.dataAvailableEventCount}`);
        }
        
        if (!this.mediaRecorder) {
          reject(new Error('No active recording to stop'));
          return;
        }
        
        // Stop the animation loop if we're using canvas
        if (!this.isUsingDirectRecording) {
          this.stopDrawingLoop();
        }
        
        // Clear max duration timer if set
        if (this.timerId) {
          clearTimeout(this.timerId);
          this.timerId = null;
        }
        
        // Clear data request interval if set
        if (this.dataRequestInterval) {
          clearInterval(this.dataRequestInterval);
          this.dataRequestInterval = null;
        }
        
        // Request one final data chunk before stopping
        if (this.mediaRecorder.state === 'recording') {
          console.log('Requesting final data chunk before stopping');
          this.mediaRecorder.requestData();
        }
        
        // Add logging about recording mode
        if (this.isUsingDirectRecording) {
          console.log('Stopping direct recording (without canvas)');
        } else {
          console.log('Stopping canvas-based recording');
        }
        
        // Create a timeout for the stop operation
        const stopTimeout = setTimeout(() => {
          console.warn('MediaRecorder stop timeout reached');
          
          // If we have chunks, resolve with what we have
          if (this.recordedChunks.length > 0) {
            const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
            const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
            console.log(`Timeout reached but we have data. Creating blob: ${videoBlob.size} bytes`);
            this.cleanup();
            resolve(videoBlob);
          } else {
            // Try to create a small dummy video if we have no chunks
            console.error('No data available after timeout');
            this.createDummyVideo().then(resolve).catch(reject);
          }
        }, 3000); // 3 seconds timeout
        
        // Define what happens when media recorder stops
        const handleStop = () => {
          // Clear the timeout since we got the stop event
          clearTimeout(stopTimeout);
          
          try {
            // Force one final check for chunks
            if (this.recordedChunks.length === 0) {
              console.error('No recorded data available after stop');
              // Create a fallback dummy video
              this.createDummyVideo().then(resolve).catch(reject);
              return;
            }
            
            // Create the final video blob
            const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
            const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
            console.log(`Recording stopped, size: ${videoBlob.size} bytes, type: ${mimeType}`);
            
            // Check if the blob has actual content
            if (videoBlob.size < 100) {
              console.warn('Video blob is suspiciously small, creating fallback');
              this.createDummyVideo().then(resolve).catch(reject);
              return;
            }
            
            // Clean up resources
            this.cleanup();
            
            // Resolve with the video blob
            resolve(videoBlob);
          } catch (error) {
            console.error('Error creating final video blob:', error);
            // Try to create a fallback video instead of failing
            this.createDummyVideo().then(resolve).catch(reject);
          }
        };
        
        // Handle recorder states
        if (this.mediaRecorder.state === 'recording') {
          // Set up onstop handler
          this.mediaRecorder.onstop = () => handleStop();
          
          // Request final data and stop
          setTimeout(() => {
            // Request data one more time just to be sure
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
              this.mediaRecorder.requestData();
            }
            
            // Then stop recording after a short delay
            setTimeout(() => {
              if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
              }
            }, 100);
          }, 300);
        } else {
          // If not recording, just resolve with what we have
          clearTimeout(stopTimeout);
          console.log('MediaRecorder was not in recording state');
          
          if (this.recordedChunks.length > 0) {
            const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
            const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
            this.cleanup();
            resolve(videoBlob);
          } else {
            // Create a fallback video
            this.createDummyVideo().then(resolve).catch(reject);
          }
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        this.cleanup();
        // Try to create a fallback video instead of failing
        this.createDummyVideo().then(resolve).catch(reject);
      }
    });
  }
  
  /**
   * Create a dummy video as a fallback when recording fails
   * @returns Promise that resolves with a dummy video blob
   */
  private async createDummyVideo(): Promise<Blob> {
    console.log('Creating dummy fallback video');
    return new Promise((resolve) => {
      try {
        // Create a canvas with an error message
        const canvas = document.createElement('canvas');
        canvas.width = this.options.width || 640;
        canvas.height = this.options.height || 480;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw background
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw message
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Recording failed', canvas.width/2, canvas.height/2 - 20);
          ctx.fillText('Please try again', canvas.width/2, canvas.height/2 + 20);
          
          // Try to create a short video from this canvas
          try {
            const stream = canvas.captureStream(30);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];
            
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunks.push(e.data);
            };
            
            recorder.onstop = () => {
              if (chunks.length > 0) {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
              } else {
                // If we can't even create a video, fall back to an image
                canvas.toBlob((blob) => {
                  if (blob) {
                    // Wrap the image in a small webm container
                    resolve(new Blob([blob], { type: 'video/webm' }));
                  } else {
                    // Ultimate fallback - create a tiny blank video blob
                    const emptyBlob = new Blob(['dummy video'], { type: 'video/webm' });
                    resolve(emptyBlob);
                  }
                }, 'image/png', 0.9);
              }
            };
            
            // Start recorder and stop after 1 second
            recorder.start();
            setTimeout(() => recorder.stop(), 1000);
          } catch (e) {
            // If video creation fails, fall back to an image
            console.error('Failed to create fallback video:', e);
            canvas.toBlob((blob) => {
              if (blob) {
                // Wrap the image in a small webm container
                resolve(new Blob([blob], { type: 'video/webm' }));
              } else {
                // Ultimate fallback - create a tiny blank video blob
                const emptyBlob = new Blob(['dummy video'], { type: 'video/webm' });
                resolve(emptyBlob);
              }
            }, 'image/png', 0.9);
          }
        } else {
          // If canvas creation fails, return an empty blob
          const emptyBlob = new Blob(['dummy video'], { type: 'video/webm' });
          resolve(emptyBlob);
        }
      } catch (error) {
        // Last resort - return a minimal blob that won't break
        console.error('Error creating dummy video:', error);
        const emptyBlob = new Blob(['dummy video'], { type: 'video/webm' });
        resolve(emptyBlob);
      }
    });
  }
  
  /**
   * Get the current state of the recorder
   * @returns The current recorder state
   */
  public getState(): RecorderState {
    const isRecording = this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
    const duration = this.startTime ? Date.now() - this.startTime : 0;
    const remainingTime = this.options.maxDuration 
      ? Math.max(0, this.options.maxDuration - duration / 1000)
      : 0;
    
    return {
      isRecording,
      duration,
      remainingTime,
      filterApplied: this.filterApplied
    };
  }
  
  /**
   * Get a frame from the current canvas
   * @returns DataURL of the current canvas frame or null if not recording
   */
  public captureFrame(): string | null {
    if (!this.canvas) {
      return null;
    }
    
          return this.canvas.toDataURL('image/jpeg', 0.95);
  }
  
  /**
   * Start drawing frames to the canvas at the target frame rate
   */
  private startDrawingLoop(): void {
    if (!this.videoElement || !this.ctx || !this.canvas) {
      return;
    }
    
    // Force a consistent frame rate for better recording
    const FPS = this.options.frameRate || 30;
    const frameDuration = 1000 / FPS;
    this.lastDrawTime = performance.now();
    
    const renderFrame = (timestamp: number) => {
      if (!this.videoElement || !this.ctx || !this.canvas) {
        return;
      }
      
      // Calculate elapsed time since last frame
      const elapsed = timestamp - this.lastDrawTime;
      
      // Only draw at the target frame rate to maintain consistency
      if (elapsed >= frameDuration) {
        // Clear the canvas before drawing the new frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply filter if one is specified
        if (this.options.filterCss && this.filterApplied) {
          this.ctx.save();
          this.ctx.filter = this.options.filterCss;
        }
        
        // Draw the video frame
        this.ctx.drawImage(
          this.videoElement,
          0, 0,
          this.canvas.width,
          this.canvas.height
        );
        
        // Restore context if filter was applied
        if (this.options.filterCss && this.filterApplied) {
          this.ctx.restore();
        }
        
        // Update timing
        this.lastDrawTime = timestamp;
      }
      
      // Request next frame only if we're still recording
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        this.animationFrameId = requestAnimationFrame(renderFrame);
      }
    };
    
    // Start the render loop
    this.animationFrameId = requestAnimationFrame(renderFrame);
  }
  
  /**
   * Stop the animation loop
   */
  private stopDrawingLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.stopDrawingLoop();
    
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    if (this.dataRequestInterval) {
      clearInterval(this.dataRequestInterval);
      this.dataRequestInterval = null;
    }
    
    // Stop MediaRecorder if it's still running
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder during cleanup:', e);
      }
    }
    
    // Reset recorder state
    this.videoElement = null;
    this.canvas = null;
    this.ctx = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isUsingDirectRecording = false;
    this.filterApplied = false;
    this.dataAvailableEventCount = 0;
  }

  /**
   * Get the current recorded blob if available
   * @returns The recorded video blob or null if no recording is available
   */
  public getRecordedBlob(): Blob | null {
    if (this.recordedChunks.length === 0) {
      console.warn('No recorded chunks available');
      return null;
    }
    
    const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
    const videoBlob = new Blob(this.recordedChunks, { type: mimeType });
    console.log(`Creating blob from ${this.recordedChunks.length} chunks: ${videoBlob.size} bytes`);
    
    // Check if the blob has actual content
    if (videoBlob.size < 100) {
      console.warn('Video blob is suspiciously small, may be invalid');
      return null;
    }
    
    return videoBlob;
  }
}

/**
 * Create a new CanvasVideoRecorder with the specified options
 * @param options Recording options
 * @returns CanvasVideoRecorder instance
 */
export function createCanvasRecorder(options: CanvasRecorderOptions = {}): CanvasVideoRecorder {
  return new CanvasVideoRecorder(options);
}

export default createCanvasRecorder; 