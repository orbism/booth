// src/components/forms/tabs/GeneralTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme } from '@/context/ThemeContext';
import { getContrastTextColor, adjustBrightness } from '@/utils/theme-utils';

interface AppearanceTabProps {
    register: UseFormRegister<SettingsFormValues>;
    watch: UseFormWatch<SettingsFormValues>;
    setValue: UseFormSetValue<SettingsFormValues>;
    errors: FieldErrors<SettingsFormValues>;
  }

const AppearanceTab: React.FC<AppearanceTabProps> = ({
    register,
    watch,
    setValue,
    errors
}) => {
    const {
        currentTheme,
        primaryColor,
        secondaryColor,
        backgroundColor,
        borderColor,
        buttonColor,
        textColor
      } = useTheme();

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
            
            <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
            </label>
            <input
                type="text"
                id="companyName"
                {...register('companyName')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
            )}
            </div>
    
            <div>
            <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700">
                Company Logo URL
            </label>
            <input
                type="text"
                id="companyLogo"
                {...register('companyLogo')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Enter a URL to your logo image</p>
            </div>
    
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                Primary Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                <input
                    type="color"
                    id="primaryColor"
                    {...register('primaryColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={currentTheme !== 'custom'}
                />
                <input
                    type="text"
                    value={watch('primaryColor') || ''}
                    onChange={(e) => setValue('primaryColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={currentTheme !== 'custom'}
                />
                </div>
                {errors.primaryColor && (
                <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
                )}
            </div>
    
            <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                Secondary Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                <input
                    type="color"
                    id="secondaryColor"
                    {...register('secondaryColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={currentTheme !== 'custom'}
                />
                <input
                    type="text"
                    value={watch('secondaryColor') || ''}
                    onChange={(e) => setValue('secondaryColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={currentTheme !== 'custom'}
                />
                </div>
                {errors.secondaryColor && (
                <p className="mt-1 text-sm text-red-600">{errors.secondaryColor.message}</p>
                )}
            </div>
    
            <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700">
                Background Color
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                <input
                    type="color"
                    id="backgroundColor"
                    {...register('backgroundColor')}
                    className="h-10 w-10 border border-gray-300 rounded-md"
                    disabled={currentTheme !== 'custom'}
                />
                <input
                    type="text"
                    value={watch('backgroundColor') || ''}
                    onChange={(e) => setValue('backgroundColor', e.target.value)}
                    className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={currentTheme !== 'custom'}
                />
                </div>
                {errors.backgroundColor && (
                <p className="mt-1 text-sm text-red-600">{errors.backgroundColor.message}</p>
                )}
            </div>
    
            {/* Add other color inputs similarly: borderColor, buttonColor, textColor */}
            </div>
    
            {/* Theme Preview */}
            <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Theme Preview</h4>
            <div 
                className="border rounded-lg overflow-hidden" 
                style={{ 
                backgroundColor,
                borderColor,
                color: textColor
                }}
            >
                <div className="p-4 border-b" style={{ borderColor }}>
                <h3 className="font-bold" style={{ color: primaryColor }}>
                    {watch('companyName')}
                </h3>
                </div>
                <div className="p-4">
                <p className="mb-4">This is a preview of your selected theme.</p>
                <button 
                    type="button" 
                    className="px-4 py-2 rounded font-medium" 
                    style={{ 
                    backgroundColor: buttonColor,
                    color: getContrastTextColor(buttonColor)
                    }}
                >
                    Sample Button
                </button>
                </div>
            </div>
            </div>
        </div>
    );
};

export default AppearanceTab;