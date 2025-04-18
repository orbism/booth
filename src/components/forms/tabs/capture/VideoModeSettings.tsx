// src/components/forms/tabs/capture/VideoModeSettings.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../../SettingsForm';
import Tooltip from '@/components/ui/Tooltip';

interface VideoModeSettingsProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

const VideoModeSettings: React.FC<VideoModeSettingsProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  // Helper to format technical terms for display
  const formatOption = (option: string): string => {
    return option
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <h4 className="text-md font-medium text-gray-800 border-b pb-2">Video Settings</h4>
      
      {/* Orientation */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="videoOrientation" className="block text-sm font-medium text-gray-700">
            Video Orientation
          </label>
          <Tooltip 
            content="Determines aspect ratio of captured videos. Device orientation may affect available options."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <select
          id="videoOrientation"
          {...register('videoOrientation')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="portrait-standard">Portrait Standard (3:4)</option>
          <option value="portrait-story">Portrait Story (9:16)</option>
          <option value="square">Square (1:1)</option>
          <option value="landscape-standard">Landscape Standard (4:3)</option>
          <option value="landscape-cinematic">Landscape Cinematic (16:9)</option>
        </select>
        {errors.videoOrientation && (
          <p className="mt-1 text-sm text-red-600">{errors.videoOrientation.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Note: Physical orientation of devices may limit available options. For example, an iPad in portrait mode cannot capture landscape videos.
        </p>
      </div>
      
      {/* Device */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="videoDevice" className="block text-sm font-medium text-gray-700">
            Device
          </label>
          <Tooltip 
            content="Optimizes video capture settings for your specific device."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <select
          id="videoDevice"
          {...register('videoDevice')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ipad">iPad</option>
          <option value="iphone">iPhone</option>
          <option value="android">Android Device</option>
          <option value="mac">Mac</option>
          <option value="pc">PC</option>
        </select>
        {errors.videoDevice && (
          <p className="mt-1 text-sm text-red-600">{errors.videoDevice.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Select the device you are using to run the booth. This helps optimize camera settings.
        </p>
      </div>
      
      {/* Resolution */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="videoResolution" className="block text-sm font-medium text-gray-700">
            Video Resolution
          </label>
          <Tooltip 
            content="Higher resolutions produce better quality but require more processing power and storage."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <select
          id="videoResolution"
          {...register('videoResolution')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="low">Low (360p)</option>
          <option value="medium">Medium (720p, recommended)</option>
          <option value="high">High (1080p, slower processing)</option>
        </select>
        {errors.videoResolution && (
          <p className="mt-1 text-sm text-red-600">{errors.videoResolution.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Medium resolution (720p) is recommended for most devices. High resolution (1080p) may cause performance issues on older devices.
        </p>
      </div>
      
      {/* Video Duration */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="videoDuration" className="block text-sm font-medium text-gray-700">
            Video Duration (seconds)
          </label>
          <Tooltip 
            content="Maximum recording time for videos. Longer videos require more storage space."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <input
          type="number"
          id="videoDuration"
          min="5"
          max="60"
          {...register('videoDuration')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.videoDuration && (
          <p className="mt-1 text-sm text-red-600">{errors.videoDuration.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Recommended range is 5-30 seconds. Longer videos require more storage and processing time.
        </p>
      </div>
      
      {/* Effects/Filters */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="videoEffect" className="block text-sm font-medium text-gray-700">
            Effects
          </label>
          <Tooltip 
            content="Apply visual effects to videos. 'None' provides original video without processing."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <select
          id="videoEffect"
          {...register('videoEffect')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="none">None</option>
          <option value="sepia">Sepia</option>
          <option value="grayscale">Black & White</option>
          <option value="invert">Invert</option>
          <option value="vintage">Vintage</option>
          <option value="comic">Comic</option>
          <option value="thermal">Thermal</option>
          <option value="xray">X-Ray</option>
        </select>
        {errors.videoEffect && (
          <p className="mt-1 text-sm text-red-600">{errors.videoEffect.message}</p>
        )}
      </div>
      
      {/* Video Preview */}
      <div className="mt-6 p-4 border rounded-md shadow-sm bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Settings Preview</h4>
        <div className="flex justify-center">
          <div className="border-2 border-gray-300 rounded shadow-sm bg-white overflow-hidden relative"
            style={{
              width: '200px',
              height: watch('videoOrientation') === 'portrait-standard' ? '267px' : 
                    watch('videoOrientation') === 'portrait-story' ? '356px' :
                    watch('videoOrientation') === 'square' ? '200px' :
                    watch('videoOrientation') === 'landscape-standard' ? '150px' :
                    '113px', // landscape-cinematic
            }}
          >
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-600">
                {formatOption(watch('videoOrientation'))}
              </span>
            </div>
            {/* Video recording icon overlay */}
            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
            <div className="absolute bottom-2 left-2 text-xs text-gray-700 bg-white bg-opacity-70 px-1 rounded">
              {watch('videoDuration')}s
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Video capture will use {watch('videoResolution')} quality.</p>
          <p className="mt-1">Video files tend to be much larger than photos and may require more processing time.</p>
        </div>
      </div>
      
      {/* Information notice */}
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
        <h4 className="text-sm font-medium mb-2">Important Video Capture Information</h4>
        <ul className="text-xs space-y-1 list-disc pl-4">
          <li>Video files are much larger than photos and may take longer to process and send.</li>
          <li>Higher resolutions and longer durations require more storage space and processing power.</li>
          <li>For optimal performance, keep videos under 15 seconds with medium resolution.</li>
          <li>Device orientation may limit available video orientations.</li>
          <li>Some older devices may experience performance issues with high-resolution video capture.</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoModeSettings;