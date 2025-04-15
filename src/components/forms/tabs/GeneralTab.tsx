// src/components/forms/tabs/GeneralTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme } from '@/context/ThemeContext';

interface GeneralTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  // We can use theme context if needed for styling
  const { primaryColor } = useTheme();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
      
      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700">
          Event Name
        </label>
        <input
          type="text"
          id="eventName"
          {...register('eventName')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="My Awesome Event"
        />
        {errors.eventName && (
          <p className="mt-1 text-sm text-red-600">{errors.eventName.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          This name will be displayed at the top of your photo booth
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="countdownTime" className="block text-sm font-medium text-gray-700">
            Countdown Time (seconds)
          </label>
          <input
            type="number"
            id="countdownTime"
            min="1"
            max="10"
            {...register('countdownTime')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.countdownTime && (
            <p className="mt-1 text-sm text-red-600">{errors.countdownTime.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            How long to count down before taking a photo
          </p>
        </div>

        <div>
          <label htmlFor="resetTime" className="block text-sm font-medium text-gray-700">
            Reset Time (seconds)
          </label>
          <input
            type="number"
            id="resetTime"
            min="10"
            max="300"
            {...register('resetTime')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.resetTime && (
            <p className="mt-1 text-sm text-red-600">{errors.resetTime.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            How long to wait before resetting the booth after completion
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
          Admin Email
        </label>
        <input
          type="email"
          id="adminEmail"
          {...register('adminEmail')}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        {errors.adminEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.adminEmail.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Notifications and admin controls will be sent to this email
        </p>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Booth Configuration Tips</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>For events, set the countdown time to 3-5 seconds</li>
                <li>For unattended booths, keep reset time between 30-60 seconds</li>
                <li>Regular events work best with a simple 3-step flow</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="testMode"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="testMode" className="font-medium text-gray-700">Test Mode</label>
            <p className="text-gray-500">
              Enable this to test your booth setup without sending emails
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;