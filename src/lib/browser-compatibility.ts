/**
 * Browser compatibility detection utility for Canvas features
 * This utility helps detect whether the browser supports various Canvas features
 */

export interface CanvasCapabilities {
  /** Whether basic Canvas API is supported */
  canvasSupported: boolean;
  /** Whether Canvas 2D API is supported */
  canvas2dSupported: boolean;
  /** Whether Canvas filters are supported */
  filtersSupported: boolean;
  /** Whether MediaRecorder API is supported */
  mediaRecorderSupported: boolean;
  /** Browser name and version if detectable */
  browser: {
    name: string;
    version: string;
  };
}

/**
 * Check if canvas filters are supported in the current browser
 * @returns Whether canvas filters are supported
 */
export function canvasFilterSupported(): boolean {
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
 * Detect MediaRecorder support and available mimeTypes
 * @returns Object containing support status and supported mimeTypes
 */
export function detectMediaRecorderSupport(): {
  supported: boolean;
  mimeTypes: string[];
} {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return { supported: false, mimeTypes: [] };
  }
  
  // Check if MediaRecorder exists
  if (!window.MediaRecorder) {
    return { supported: false, mimeTypes: [] };
  }
  
  // Check which mimeTypes are supported
  const mimeTypes = [
    'video/webm',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm;codecs=h264',
    'video/mp4',
  ];
  
  const supported = mimeTypes.filter(mimeType => {
    try {
      return MediaRecorder.isTypeSupported(mimeType);
    } catch (e) {
      return false;
    }
  });
  
  return {
    supported: supported.length > 0,
    mimeTypes: supported,
  };
}

/**
 * Detect browser name and version
 * @returns Browser name and version
 */
export function detectBrowser(): { name: string; version: string } {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || !navigator) {
    return { name: 'unknown', version: 'unknown' };
  }
  
  const userAgent = navigator.userAgent;
  
  // Default to unknown
  let browser = { name: 'unknown', version: 'unknown' };
  
  // Try to detect browser from user agent
  if (userAgent.indexOf('Firefox') > -1) {
    browser.name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) browser.version = match[1];
  } else if (userAgent.indexOf('Edg') > -1) {
    browser.name = 'Edge';
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    if (match) browser.version = match[1];
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser.name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) browser.version = match[1];
  } else if (userAgent.indexOf('Safari') > -1) {
    browser.name = 'Safari';
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) browser.version = match[1];
  } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) {
    browser.name = 'Internet Explorer';
    const match = userAgent.match(/(?:MSIE |rv:)(\d+\.\d+)/);
    if (match) browser.version = match[1];
  }
  
  return browser;
}

/**
 * Detect Canvas capabilities of the current browser
 * @returns Canvas capabilities
 */
export function detectCanvasCapabilities(): CanvasCapabilities {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return {
      canvasSupported: false,
      canvas2dSupported: false,
      filtersSupported: false,
      mediaRecorderSupported: false,
      browser: { name: 'unknown', version: 'unknown' },
    };
  }
  
  // Check Canvas support
  const canvasSupported = !!window.HTMLCanvasElement;
  
  // Check Canvas 2D context support
  let canvas2dSupported = false;
  if (canvasSupported) {
    try {
      const canvas = document.createElement('canvas');
      canvas2dSupported = !!canvas.getContext('2d');
    } catch (e) {
      console.warn('Error testing Canvas 2D support:', e);
    }
  }
  
  // Check filter support
  const filtersSupported = canvasFilterSupported();
  
  // Check MediaRecorder support
  const { supported: mediaRecorderSupported } = detectMediaRecorderSupport();
  
  // Detect browser
  const browser = detectBrowser();
  
  return {
    canvasSupported,
    canvas2dSupported,
    filtersSupported,
    mediaRecorderSupported,
    browser,
  };
}

/**
 * Get recommendations for browser improvements based on detected capabilities
 * @param capabilities Detected capabilities
 * @returns Array of recommendation messages
 */
export function getBrowserRecommendations(
  capabilities: CanvasCapabilities
): string[] {
  const recommendations: string[] = [];
  
  // If Canvas isn't supported at all, recommend a modern browser
  if (!capabilities.canvasSupported) {
    recommendations.push(
      'Your browser does not support features needed for video recording. ' +
      'Please try using Chrome, Edge, or Firefox for the best experience.'
    );
    return recommendations;
  }
  
  // If MediaRecorder isn't supported, recommend a browser that supports it
  if (!capabilities.mediaRecorderSupported) {
    recommendations.push(
      'Your browser does not support video recording. ' +
      'Please try using Chrome, Edge, or Firefox for the best experience.'
    );
  }
  
  // If filters aren't supported, provide a specific message about that
  if (!capabilities.filtersSupported) {
    recommendations.push(
      'Your browser may have limited support for video filters. You can record videos, but filters may not be applied. ' +
      'For the best experience with filters, try using Chrome or Edge.'
    );
  }
  
  // Browser-specific recommendations
  if (capabilities.browser.name === 'Safari') {
    recommendations.push(
      'Safari has limited support for some video features. Your recording will work, but filters may not be applied. ' +
      'For the best experience with video filters, consider using Chrome or Edge.'
    );
  } else if (capabilities.browser.name === 'Firefox' && !capabilities.filtersSupported) {
    recommendations.push(
      'Firefox may have limited support for video filters in this version. You can record videos, but filters may not be applied. ' +
      'For the best filter support, consider trying Chrome or Edge.'
    );
  }
  
  return recommendations;
}

export default detectCanvasCapabilities; 