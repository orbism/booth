// src/components/forms/tabs/capture/PhotoModeSettings.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../../SettingsForm';
import Tooltip from '@/components/ui/Tooltip';

interface PhotoModeSettingsProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

const PhotoModeSettings: React.FC<PhotoModeSettingsProps> = ({
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
      <h4 className="text-md font-medium text-gray-800 border-b pb-2">Photo Settings</h4>
      
      {/* Orientation */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="photoOrientation" className="block text-sm font-medium text-gray-700">
            Image Orientation
          </label>
          <Tooltip 
            content="Determines aspect ratio of captured photos. Device orientation may affect available options."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <select
          id="photoOrientation"
          {...register('photoOrientation')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="portrait-standard">Portrait Standard (3:4)</option>
          <option value="portrait-story">Portrait Story (9:16)</option>
          <option value="square">Square (1:1)</option>
          <option value="landscape-standard">Landscape Standard (4:3)</option>
          <option value="landscape-cinematic">Landscape Cinematic (16:9)</option>
        </select>
        {errors.photoOrientation && (
          <p className="mt-1 text-sm text-red-600">{errors.photoOrientation.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Note: Physical orientation of iPads may limit available options. For example, an iPad in portrait mode cannot capture landscape photos.
        </p>
      </div>
      
      {/* Device */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="photoDevice" className="block text-sm font-medium text-gray-700">
            Device
          </label>
          <Tooltip 
            content="Optimizes photo capture settings for your specific device."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <select
          id="photoDevice"
          {...register('photoDevice')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ipad">iPad</option>
          <option value="iphone">iPhone</option>
          <option value="android">Android Device</option>
          <option value="mac">Mac</option>
          <option value="pc">PC</option>
        </select>
        {errors.photoDevice && (
          <p className="mt-1 text-sm text-red-600">{errors.photoDevice.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Select the device you are using to run the booth. This helps optimize camera settings.
        </p>
      </div>
      
      {/* Resolution */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="photoResolution" className="block text-sm font-medium text-gray-700">
            Image Resolution
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
          id="photoResolution"
          {...register('photoResolution')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="low">Low (faster, smaller files)</option>
          <option value="medium">Medium (recommended)</option>
          <option value="high">High (slower, larger files)</option>
        </select>
        {errors.photoResolution && (
          <p className="mt-1 text-sm text-red-600">{errors.photoResolution.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Medium is recommended for most devices. High resolution may slow down older devices.
        </p>
      </div>
      
      {/* Effects/Filters */}
      <div>
        <div className="flex justify-between items-center">
          <label htmlFor="photoEffect" className="block text-sm font-medium text-gray-700">
            Effects
          </label>
          <Tooltip 
            content="Apply visual effects to photos. 'None' provides original image without processing."
            position="left"
          >
            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </Tooltip>
        </div>
        <select
          id="photoEffect"
          {...register('photoEffect')}
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
        {errors.photoEffect && (
          <p className="mt-1 text-sm text-red-600">{errors.photoEffect.message}</p>
        )}
      </div>
      
      {/* Toggle settings */}
      <div className="mt-6 space-y-4">
        {/* Printer */}
        <div className="flex items-center">
          <input
            id="printerEnabled"
            type="checkbox"
            {...register('printerEnabled')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="ml-3">
            <label htmlFor="printerEnabled" className="text-sm font-medium text-gray-700 flex items-center">
              Enable Printer
              <Tooltip 
                content="Allows users to print their photos. Requires connected printer."
                position="right"
              >
                <svg className="w-4 h-4 ml-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </Tooltip>
            </label>
            <p className="text-xs text-gray-500">
              This will allow users to print their photos. Requires a compatible printer to be connected.
            </p>
          </div>
        </div>
        
        {/* AI Image Correction */}
        <div className="flex items-center">
          <input
            id="aiImageCorrection"
            type="checkbox"
            {...register('aiImageCorrection')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="ml-3">
            <label htmlFor="aiImageCorrection" className="text-sm font-medium text-gray-700 flex items-center">
              AI Image Correction
              <Tooltip 
                content="Experimental feature that automatically adjusts lighting, color, and sharpness."
                position="right"
              >
                <svg className="w-4 h-4 ml-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </Tooltip>
            </label>
            <p className="text-xs text-gray-500">
              Experimental feature that automatically enhances photos by adjusting lighting, shadows, and colors. 
              Results may be unpredictable.
            </p>
          </div>
        </div>
      </div>
      
      {/* Photo Preview */}
      <div className="mt-6 p-4 border rounded-md shadow-sm bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Settings Preview</h4>
        <div className="flex justify-center">
          <div className="border-2 border-gray-300 rounded shadow-sm bg-white overflow-hidden"
            style={{
              width: '200px',
              height: watch('photoOrientation') === 'portrait-standard' ? '267px' : 
                    watch('photoOrientation') === 'portrait-story' ? '356px' :
                    watch('photoOrientation') === 'square' ? '200px' :
                    watch('photoOrientation') === 'landscape-standard' ? '150px' :
                    '113px', // landscape-cinematic
            }}
          >
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-600">
                {formatOption(watch('photoOrientation'))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoModeSettings;