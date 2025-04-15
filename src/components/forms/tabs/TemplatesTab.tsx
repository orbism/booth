// src/components/forms/tabs/TemplatesTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme, THEMES, ThemeOption } from '@/context/ThemeContext';
import { getContrastTextColor, adjustBrightness } from '@/utils/theme-utils';

interface TemplatesTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  const {
    currentTheme,
    primaryColor,
    backgroundColor,
    borderColor,
    buttonColor,
    textColor,
    handleThemeChange
  } = useTheme();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Template Selection</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Midnight Template */}
        <div 
          className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
            currentTheme === 'midnight' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
          }`}
          onClick={() => handleThemeChange('midnight')}
        >
          <div className="p-4" style={{ 
            backgroundColor: THEMES.midnight.backgroundColor,
            color: THEMES.midnight.textColor
          }}>
            <h4 className="font-semibold mb-2" style={{ color: THEMES.midnight.primaryColor }}>
              Midnight Theme
            </h4>
            <div className="h-20 flex flex-col justify-between">
              <p className="text-sm">Dark purple theme with vibrant accents</p>
              <button 
                className="px-3 py-1 rounded text-sm mt-2 w-24"
                style={{ 
                  backgroundColor: THEMES.midnight.buttonColor,
                  color: getContrastTextColor(THEMES.midnight.buttonColor)
                }}
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Pastel Template */}
        <div 
          className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
            currentTheme === 'pastel' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
          }`}
          onClick={() => handleThemeChange('pastel')}
        >
          <div className="p-4" style={{ 
            backgroundColor: THEMES.pastel.backgroundColor,
            color: THEMES.pastel.textColor
          }}>
            <h4 className="font-semibold mb-2" style={{ color: THEMES.pastel.primaryColor }}>
              Pastel Theme
            </h4>
            <div className="h-20 flex flex-col justify-between">
              <p className="text-sm">Soft pastel colors with gentle styling</p>
              <button 
                className="px-3 py-1 rounded text-sm mt-2 w-24"
                style={{ 
                  backgroundColor: THEMES.pastel.buttonColor,
                  color: getContrastTextColor(THEMES.pastel.buttonColor)
                }}
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Black & White Template */}
        <div 
          className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
            currentTheme === 'bw' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
          }`}
          onClick={() => handleThemeChange('bw')}
        >
          <div className="p-4" style={{ 
            backgroundColor: THEMES.bw.backgroundColor,
            color: THEMES.bw.textColor
          }}>
            <h4 className="font-semibold mb-2" style={{ color: THEMES.bw.primaryColor }}>
              Black & White Theme
            </h4>
            <div className="h-20 flex flex-col justify-between">
              <p className="text-sm">Clean monochromatic design</p>
              <button 
                className="px-3 py-1 rounded text-sm mt-2 w-24"
                style={{ 
                  backgroundColor: THEMES.bw.buttonColor,
                  color: getContrastTextColor(THEMES.bw.buttonColor)
                }}
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        {/* Custom Template */}
        <div 
          className={`border-2 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
            currentTheme === 'custom' ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
          }`}
          onClick={() => handleThemeChange('custom')}
        >
          <div className="p-4" style={{ 
            backgroundColor,
            color: textColor
          }}>
            <h4 className="font-semibold mb-2" style={{ color: primaryColor }}>
              Custom Theme
            </h4>
            <div className="h-20 flex flex-col justify-between">
              <p className="text-sm">Define your own custom colors</p>
              <button 
                className="px-3 py-1 rounded text-sm mt-2 w-24"
                style={{ 
                  backgroundColor: buttonColor,
                  color: getContrastTextColor(buttonColor)
                }}
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Journey Configuration Section */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Journey</h3>
        <p className="text-sm text-gray-600 mb-4">
          Configure the steps that users will go through in your photo booth experience.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="step-info"
              checked={true}
              disabled={true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="step-info" className="ml-3 block text-sm font-medium text-gray-700">
              Information Collection (Required)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="step-photo"
              checked={true}
              disabled={true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="step-photo" className="ml-3 block text-sm font-medium text-gray-700">
              Photo/Video Capture (Required)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="step-preview"
              checked={true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="step-preview" className="ml-3 block text-sm font-medium text-gray-700">
              Preview & Approval
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="step-effects"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="step-effects" className="ml-3 block text-sm font-medium text-gray-700">
              Apply Effects & Filters
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="step-social"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="step-social" className="ml-3 block text-sm font-medium text-gray-700">
              Social Media Sharing
            </label>
          </div>
        </div>
      </div>

      {/* Live Preview Section */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Live Preview</h4>
        <div 
          className="border rounded-lg overflow-hidden shadow-sm" 
          style={{ 
            backgroundColor: currentTheme === 'custom' 
              ? backgroundColor 
              : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].backgroundColor,
            color: currentTheme === 'custom' 
              ? textColor 
              : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].textColor,
          }}
        >
          <div className="p-4 border-b" style={{ 
            borderColor: currentTheme === 'custom' 
              ? borderColor 
              : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].borderColor 
          }}>
            <h3 className="font-bold" style={{ 
              color: currentTheme === 'custom' 
                ? primaryColor 
                : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].primaryColor 
            }}>
              {watch('companyName')}
            </h3>
          </div>
          <div className="p-6">
            <div className="mb-4 text-center">
              <p className="font-medium text-lg mb-1" style={{ 
                color: currentTheme === 'custom' 
                  ? primaryColor 
                  : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].primaryColor 
              }}>
                Welcome to the Photo Booth!
              </p>
              <p className="text-sm">Please enter your information to continue</p>
            </div>
            
            {/* Form Preview */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  disabled
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ 
                    borderColor: currentTheme === 'custom' 
                      ? borderColor 
                      : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].borderColor,
                    backgroundColor: adjustBrightness(
                      currentTheme === 'custom' 
                        ? backgroundColor 
                        : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].backgroundColor,
                      0.1
                    )
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  placeholder="john@example.com"
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ 
                    borderColor: currentTheme === 'custom' 
                      ? borderColor 
                      : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].borderColor,
                    backgroundColor: adjustBrightness(
                      currentTheme === 'custom' 
                        ? backgroundColor 
                        : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].backgroundColor,
                      0.1
                    )
                  }}
                />
              </div>
            </div>
            
            {/* Button Preview */}
            <div className="text-center">
              <button 
                className="px-4 py-2 rounded font-medium"
                style={{ 
                  backgroundColor: currentTheme === 'custom' 
                    ? buttonColor 
                    : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].buttonColor,
                  color: getContrastTextColor(
                    currentTheme === 'custom' 
                      ? buttonColor 
                      : THEMES[currentTheme as Exclude<ThemeOption, 'custom'>].buttonColor
                  )
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesTab;