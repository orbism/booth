// src/components/forms/tabs/CaptureModeTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme } from '@/context/ThemeContext';
import PhotoModeSettings from './capture/PhotoModeSettings';
import VideoModeSettings from './capture/VideoModeSettings';

interface CaptureModeTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

const CaptureModeTab: React.FC<CaptureModeTabProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  const { buttonColor } = useTheme();
  
  const captureMode = watch('captureMode') || 'photo';
  
  // Handle capture mode toggle
  const handleModeToggle = (mode: 'photo' | 'video') => {
    setValue('captureMode', mode);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Capture Mode Settings</h3>
      
      {/* Photo/Video Mode Toggle */}
      <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
        <h4 className="text-base font-medium text-blue-800 mb-4">Select Capture Mode</h4>
        <p className="text-sm text-blue-700 mb-4">
          Choose whether your booth captures photos or videos. Each mode has different settings.
        </p>
        
        <div className="flex justify-center w-full max-w-md mx-auto bg-white p-1 rounded-lg shadow-inner">
          <button
            type="button"
            onClick={() => handleModeToggle('photo')}
            className={`flex-1 py-3 text-center font-medium rounded-md transition-all ${
              captureMode === 'photo' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ 
              backgroundColor: captureMode === 'photo' ? buttonColor : 'transparent',
              color: captureMode === 'photo' ? 'white' : undefined 
            }}
          >
            Photo Mode
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle('video')}
            className={`flex-1 py-3 text-center font-medium rounded-md transition-all ${
              captureMode === 'video' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ 
              backgroundColor: captureMode === 'video' ? buttonColor : 'transparent',
              color: captureMode === 'video' ? 'white' : undefined
            }}
          >
            Video Mode
          </button>
        </div>
      </div>
      
      {/* Render the appropriate settings component based on selected mode */}
      {captureMode === 'photo' ? (
        <PhotoModeSettings 
          register={register} 
          watch={watch} 
          setValue={setValue} 
          errors={errors} 
        />
      ) : (
        <VideoModeSettings 
          register={register} 
          watch={watch} 
          setValue={setValue} 
          errors={errors} 
        />
      )}
    </div>
  );
};

export default CaptureModeTab;