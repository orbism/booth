// src/components/forms/tabs/CustomJourneyTab.tsx
import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors, useFieldArray, Control } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme } from '@/context/ThemeContext';

interface CustomJourneyTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
  control: Control<SettingsFormValues>;
}

interface JourneyPage {
  id: string;
  title: string;
  content: string;
  backgroundImage: string | null;
  buttonText: string;
  buttonImage: string | null;
}

const CustomJourneyTab: React.FC<CustomJourneyTabProps> = ({
  register,
  watch,
  setValue,
  errors,
  control
}) => {
  const [isCustomJourneyEnabled, setIsCustomJourneyEnabled] = useState<boolean>(
    watch('customJourneyEnabled') || false
  );
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  
  // Use useFieldArray for managing journey pages
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "journeyPages"
  });
  
  // Handle toggling custom journey mode
  const handleToggleCustomJourney = () => {
    const newValue = !isCustomJourneyEnabled;
    setIsCustomJourneyEnabled(newValue);
    setValue('customJourneyEnabled', newValue);
    
    // Initialize with a default page if enabling and no pages exist
    if (newValue && fields.length === 0) {
      append({
        id: `page-${Date.now()}`,
        title: 'Welcome',
        content: 'Welcome to our photo booth!',
        backgroundImage: null,
        buttonText: 'Start',
        buttonImage: null
      });
    }
  };
  
  // Handle adding a new page
  const handleAddPage = () => {
    if (fields.length >= 8) {
      alert('Maximum 8 pages allowed');
      return;
    }
    
    append({
      id: `page-${Date.now()}`,
      title: `Page ${fields.length + 1}`,
      content: 'Enter your content here',
      backgroundImage: null,
      buttonText: 'Next',
      buttonImage: null
    });
  };
  
  // Handle page reordering
  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      move(index, index - 1);
    } else if (direction === 'down' && index < fields.length - 1) {
      move(index, index + 1);
    }
  };
  
  // Handle reset confirmation
  const handleReset = () => {
    setShowResetModal(false);
    setValue('customJourneyEnabled', false);
    setValue('journeyPages', []);
    setIsCustomJourneyEnabled(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Custom User Journey</h3>
      
      <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
        <h4 className="text-base font-medium text-blue-800 mb-2">About Custom User Journey</h4>
        <p className="text-sm text-blue-700 mb-4">
          Create a personalized flow for your booth users. You can add up to 8 custom pages with your own text, 
          backgrounds, and button designs. Each page will lead to the next, eventually bringing users to the photo capture.
        </p>
        
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleToggleCustomJourney}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
              isCustomJourneyEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className="sr-only">Use custom journey</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                isCustomJourneyEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-900">
            {isCustomJourneyEnabled ? 'Custom Journey Enabled' : 'Use Default Journey'}
          </span>
        </div>
      </div>
      
      {isCustomJourneyEnabled && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-medium text-gray-900">Journey Pages</h4>
            <div className="space-x-3">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-3 py-1 text-sm font-medium text-red-700 border border-red-300 rounded hover:bg-red-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleAddPage}
                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                disabled={fields.length >= 8}
              >
                Add Page
              </button>
            </div>
          </div>
          
          {fields.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-md">
              <p className="text-gray-500">No pages added yet. Click "Add Page" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-white border rounded-md shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                    <h5 className="font-medium">Page {index + 1}</h5>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleMovePage(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePage(index, 'down')}
                        disabled={index === fields.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page Title
                      </label>
                      <input
                        type="text"
                        {...register(`journeyPages.${index}.title` as const)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        rows={3}
                        {...register(`journeyPages.${index}.content` as const)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Background Image
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            {...register(`journeyPages.${index}.backgroundImage` as const)}
                            placeholder="Upload or enter URL"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            className="px-3 py-2 bg-gray-200 text-gray-700 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-300"
                          >
                            Browse
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          {...register(`journeyPages.${index}.buttonText` as const)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Button Image (optional)
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          {...register(`journeyPages.${index}.buttonImage` as const)}
                          placeholder="Upload or enter URL"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-gray-200 text-gray-700 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-300"
                        >
                          Browse
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        This will replace the text button with your custom image
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-gray-50 border rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <p className="text-xs text-gray-500 mb-4">
              This is a simplified preview of your custom journey flow:
            </p>
            
            <div className="flex flex-wrap items-center">
              {fields.map((field, index) => (
                <React.Fragment key={field.id}>
                  <div className="bg-white border rounded px-3 py-2 text-sm">
                    {watch(`journeyPages.${index}.title` as const) || `Page ${index + 1}`}
                  </div>
                  {index < fields.length - 1 && (
                    <div className="mx-2 text-gray-400">→</div>
                  )}
                </React.Fragment>
              ))}
              {fields.length > 0 && (
                <>
                  <div className="mx-2 text-gray-400">→</div>
                  <div className="bg-blue-100 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800">
                    Photo Capture
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleToggleCustomJourney}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Revert to Default Journey
              </button>
              
              <button
                type="button"
                className="px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Import Previous Setup
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Custom Journey?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to reset your custom journey? This will delete all pages and customizations.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomJourneyTab;