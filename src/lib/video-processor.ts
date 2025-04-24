// src/lib/video-processor.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { AVAILABLE_FILTERS } from '@/components/forms/tabs/FiltersTab';

interface VideoProcessingOptions {
  filterId: string;
  onProgress?: (progress: number) => void;
}

let ffmpegInstance: FFmpeg | null = null;

/**
 * Initialize FFmpeg - should be called before any processing
 */
async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
    if (ffmpegInstance) return ffmpegInstance;
  
    ffmpegInstance = new FFmpeg();
  
    if (onProgress) {
      ffmpegInstance.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }
  
    // Load the core - using CDN links directly instead of toBlobURL
    try {
      // For Next.js compatibility, load directly from CDN
      await ffmpegInstance.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm',
      });
      
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to load FFmpeg: ' + error);
    }
  
    return ffmpegInstance;
  }

/**
 * Convert CSS filter to FFmpeg filter complex command
 */
function cssFilterToFFmpegFilter(filterId: string): string {
  const filterInfo = AVAILABLE_FILTERS.find(f => f.id === filterId);
  
  if (!filterInfo || filterId === 'normal') return '';
  
  // Map CSS filters to FFmpeg equivalents
  switch (filterId) {
    case 'sepia':
      return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
    case 'grayscale':
      return 'colorchannelmixer=.3:.4:.3:0:.3:.4:.3:0:.3:.4:.3';
    case 'invert':
      return 'negate';
    case 'saturate':
      return 'eq=saturation=2';
    case 'contrast':
      return 'eq=contrast=1.5';
    case 'blur':
      return 'gblur=sigma=2';
    case 'hue-rotate':
      return 'hue=h=180';
    case 'vintage':
      return 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131,eq=saturation=1.4:contrast=1.1';
    default:
      return '';
  }
}

/**
 * Process video with filter
 * @param videoBlob Video blob to process
 * @param options Processing options
 * @returns Processed video blob
 */
export async function processVideo(
  videoBlob: Blob,
  options: VideoProcessingOptions
): Promise<Blob> {
  try {
    // Initialize FFmpeg with progress callback
    const ffmpegInstance = await initFFmpeg(options.onProgress);
    
    // If no filter or normal filter, return the original video
    if (!options.filterId || options.filterId === 'normal') {
      return videoBlob;
    }
    
    // Convert filter CSS to FFmpeg filter command
    const ffmpegFilter = cssFilterToFFmpegFilter(options.filterId);
    if (!ffmpegFilter) {
      console.log('No filter applied, returning original video');
      return videoBlob;
    }
    
    // Prepare input/output file names
    const inputFileName = 'input.webm';
    const outputFileName = 'output.mp4';
    
    // Write input file to memory
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(videoBlob));
    
    // Build FFmpeg command based on filter
    let ffmpegCmd = [];
    
    // Input file
    ffmpegCmd.push('-i', inputFileName);
    
    // Apply filter if needed
    if (ffmpegFilter) {
      ffmpegCmd.push('-vf', ffmpegFilter);
    }
    
    // Output settings - use h264 codec and aac audio for better compatibility
    ffmpegCmd.push(
      '-c:v', 'libx264', 
      '-c:a', 'aac',
      '-preset', 'ultrafast', // Use ultrafast for quick processing
      '-crf', '28', // Compromise between quality and size
      '-pix_fmt', 'yuv420p', // Required for compatibility
      outputFileName
    );
    
    // Run FFmpeg command
    console.log('Running FFmpeg command:', ffmpegCmd.join(' '));
    await ffmpegInstance.exec(ffmpegCmd);
    
    // Read the output file
    const data = await ffmpegInstance.readFile(outputFileName);
    
    // Create output blob
    const outputBlob = new Blob([data], { type: 'video/mp4' });
    
    return outputBlob;
  } catch (error) {
    console.error('Error processing video:', error);
    // Return original video on error
    return videoBlob;
  }
}