// src/components/forms/tabs/SplashTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme } from '@/context/ThemeContext';
import FileUploadField from '../FileUploadField';
import { getContrastTextColor } from '@/utils/theme-utils';

interface SplashTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

const SplashTab: React.FC<SplashTabProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  const {
    primaryColor,
    backgroundColor,
    buttonColor,
    textColor
  } = useTheme();
  
  const splashPageEnabled = watch('splashPageEnabled') || false;

  // Handle toggling splash page
  const handleToggleSplashPage = () => {
    setValue('splashPageEnabled', !splashPageEnabled);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Splash Page Settings</h3>
      
      <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
        <h4 className="text-base font-medium text-blue-800 mb-2">About Splash Page</h4>
        <p className="text-sm text-blue-700 mb-4">
          Create a welcome screen that will be shown before users enter their information.
          This is great for event branding and instructions.
        </p>
        
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleToggleSplashPage}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
              splashPageEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className="sr-only">Enable splash page</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                splashPageEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-900">
            {splashPageEnabled ? 'Splash Page Enabled' : 'Splash Page Disabled'}
          </span>
        </div>
      </div>
      
      {splashPageEnabled && (
        <div className="space-y-6">
          <div>
            <label htmlFor="splashPageTitle" className="block text-sm font-medium text-gray-700">
              Splash Page Title
            </label>
            <input
              type="text"
              id="splashPageTitle"
              {...register('splashPageTitle')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Welcome to Our Photo Booth!"
            />
          </div>
          
          <div>
            <label htmlFor="splashPageContent" className="block text-sm font-medium text-gray-700">
              Splash Page Content
            </label>
            <textarea
              id="splashPageContent"
              rows={4}
              {...register('splashPageContent')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter instructions or a welcome message for your guests."
            />
          </div>
          
          <FileUploadField
            id="splashPageImage"
            name="splashPageImage"
            label="Background Image"
            accept="image/*"
            helpText="Recommended size: 1920x1080px. Optional - leave blank for a solid color background."
            register={register}
            setValue={setValue}
            watch={watch}
          />
          
          <div>
            <label htmlFor="splashPageButtonText" className="block text-sm font-medium text-gray-700">
              Button Text
            </label>
            <input
              type="text"
              id="splashPageButtonText"
              {...register('splashPageButtonText')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start"
            />
          </div>
          
          {/* Preview */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Preview</h4>
            <div 
              className="border rounded-lg overflow-hidden p-6 flex flex-col items-center justify-center min-h-[300px] relative"
              style={{ 
                backgroundColor,
                color: textColor,
              }}
            >
              {watch('splashPageImage') && (
                <div className="absolute inset-0 z-0">
                    <img 
                        src={watch('splashPageImage') || ''} 
                        alt="Background" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                </div>
              )}
              
              <div className="relative z-10 text-center space-y-4 max-w-md mx-auto">
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {watch('splashPageTitle') || 'Welcome to Our Photo Booth!'}
                </h2>
                <div className="text-lg text-white">
                  {watch('splashPageContent') || 'Enter instructions or a welcome message for your guests.'}
                </div>
              </div>
              
              <div className="relative z-10 mt-8">
                <button
                  className="px-6 py-3 rounded-lg shadow-md text-lg font-medium transition-colors"
                  style={{ 
                    backgroundColor: buttonColor,
                    color: getContrastTextColor(buttonColor)
                  }}
                >
                  {watch('splashPageButtonText') || 'Start'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashTab;