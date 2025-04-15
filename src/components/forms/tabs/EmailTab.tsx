// src/components/forms/tabs/GeneralTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme, THEMES } from '@/context/ThemeContext';
import { getContrastTextColor } from '@/utils/theme-utils';

// In EmailTab.tsx
interface EmailTabProps {
    register: UseFormRegister<SettingsFormValues>;
    watch: UseFormWatch<SettingsFormValues>;
    setValue: UseFormSetValue<SettingsFormValues>;
    errors: FieldErrors<SettingsFormValues>;
  }

const EmailTab: React.FC<EmailTabProps> = ({
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
        textColor
        } = useTheme();

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Email Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700">
                SMTP Host
                </label>
                <input
                type="text"
                id="smtpHost"
                {...register('smtpHost')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpHost && (
                <p className="mt-1 text-sm text-red-600">{errors.smtpHost.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">
                SMTP Port
                </label>
                <input
                type="number"
                id="smtpPort"
                {...register('smtpPort')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpPort && (
                <p className="mt-1 text-sm text-red-600">{errors.smtpPort.message}</p>
                )}
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700">
                SMTP Username
                </label>
                <input
                type="text"
                id="smtpUser"
                {...register('smtpUser')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpUser && (
                <p className="mt-1 text-sm text-red-600">{errors.smtpUser.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
                SMTP Password
                </label>
                <input
                type="password"
                id="smtpPassword"
                {...register('smtpPassword')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.smtpPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.smtpPassword.message}</p>
                )}
            </div>
            </div>

            <div>
            <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">
                Email Subject
            </label>
            <input
                type="text"
                id="emailSubject"
                {...register('emailSubject')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.emailSubject && (
                <p className="mt-1 text-sm text-red-600">{errors.emailSubject.message}</p>
            )}
            </div>

            <div>
            <label htmlFor="emailTemplate" className="block text-sm font-medium text-gray-700">
                Email Template
            </label>
            <textarea
                id="emailTemplate"
                rows={4}
                {...register('emailTemplate')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.emailTemplate && (
                <p className="mt-1 text-sm text-red-600">{errors.emailTemplate.message}</p>
            )}
            </div>

            {/* Email Preview */}
            <div className="mt-6 border rounded-md p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Email Preview</h4>
                <div className="border rounded-md p-4" style={{ 
                backgroundColor: currentTheme === 'custom' ? backgroundColor : THEMES[currentTheme].backgroundColor,
                color: currentTheme === 'custom' ? textColor : THEMES[currentTheme].textColor,
                borderColor: currentTheme === 'custom' ? borderColor : THEMES[currentTheme].borderColor
                }}>
                <div className="text-sm">
                    {watch('emailTemplate')}
                </div>
                <div className="mt-4 pt-4 border-t text-xs text-right" 
                    style={{ 
                    backgroundColor: currentTheme === 'custom' ? buttonColor : THEMES[currentTheme].buttonColor,
                    color: getContrastTextColor(
                        currentTheme === 'custom' ? buttonColor : THEMES[currentTheme].buttonColor
                    )
                    }}>
                    {watch('companyName')}
                </div>
                </div>
            </div>
        </div>
    );
};

export default EmailTab;