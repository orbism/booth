// src/components/forms/tabs/CustomJourneyTab.tsx

import React, { useState, useEffect } from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors, useFieldArray, Control } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme } from '@/context/ThemeContext';
import FileUploadField from '../FileUploadField';

interface CustomJourneyTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
  control: Control<SettingsFormValues>;
}

interface SavedJourney {
  id: string;
  name: string;
  pages: any[];
}

const CustomJourneyTab: React.FC<CustomJourneyTabProps> = ({
  register,
  watch,
  setValue,
  errors,
  control
}) => {
  const customJourneyEnabled = watch('customJourneyEnabled');
  const journeyName = watch('journeyName') || 'Default Journey';
  const journeyId = watch('journeyId');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [journeyToDelete, setJourneyToDelete] = useState<string | null>(null);

  console.log('Journey state:', { 
    customJourneyEnabled, 
    journeyName, 
    journeyId,
    journeyPagesCount: watch('journeyPages')?.length || 0
  });
  
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [showCreateNewModal, setShowCreateNewModal] = useState<boolean>(false);
  const [newJourneyName, setNewJourneyName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Use useFieldArray for managing journey pages
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "journeyPages"
  });

  // Journey deletion handler
  const handleDeleteJourney = async (journeyId: string) => {
    // Set the journey to delete and show confirmation modal
    setJourneyToDelete(journeyId);
    setShowDeleteModal(true);
  };

  // Journey deletion confirmation
  const confirmDeleteJourney = async () => {
    if (!journeyToDelete) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/admin/journeys?id=${journeyToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete journey');
      }
      
      // Update the saved journeys list
      setSavedJourneys(prev => prev.filter(journey => journey.id !== journeyToDelete));
      
      // If this was the active journey, reset the form
      if (journeyToDelete === journeyId) {
        setValue('journeyId', '');
        setValue('journeyName', '');
        setValue('journeyPages', []);
      }
      
      setShowDeleteModal(false);
      setJourneyToDelete(null);
      
    } catch (error) {
      console.error('Error deleting journey:', error);
      alert('Failed to delete journey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch saved journeys on component mount
  useEffect(() => {
    const fetchSavedJourneys = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/journeys');
        if (response.ok) {
          const data = await response.json();
          setSavedJourneys(data);
        }
      } catch (error) {
        console.error('Failed to fetch saved journeys:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSavedJourneys();
  }, []);
  
  // Handle toggling custom journey mode
  const handleToggleCustomJourney = () => {
    const newValue = !customJourneyEnabled;
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
  
  // Handle journey selection
  const handleJourneySelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    
    if (selectedId === 'new') {
      setShowCreateNewModal(true);
      return;
    }
    
    const selectedJourney = savedJourneys.find(journey => journey.id === selectedId);
    if (selectedJourney) {
      setValue('journeyName', selectedJourney.name);
      setValue('journeyId', selectedId);
      
      // Clear existing pages and add selected journey pages
      // This approach avoids type issues by directly setting the journey pages
      setValue('journeyPages', []);
      selectedJourney.pages.forEach(page => {
        append(page);
      });
    }
  };
  
  // Handle creating a new journey
  const handleCreateNewJourney = () => {
    if (!newJourneyName.trim()) {
      alert('Please enter a journey name');
      return;
    }
    
    setValue('journeyName', newJourneyName);
    setValue('journeyId', `journey-${Date.now()}`);
    setValue('journeyPages', []);
    
    // Add default first page
    append({
      id: `page-${Date.now()}`,
      title: 'Welcome',
      content: 'Welcome to our photo booth!',
      backgroundImage: null,
      buttonText: 'Start',
      buttonImage: null
    });
    
    setShowCreateNewModal(false);
    setNewJourneyName('');
  };
  
  // Handle saving a journey
  const handleSaveJourney = async () => {
    if (!journeyName.trim()) {
      alert('Please enter a journey name');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const journeyData = {
        id: journeyId || `journey-${Date.now()}`,
        name: journeyName,
        pages: fields
      };
      
      const response = await fetch('/api/admin/journeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(journeyData)
      });
      
      if (response.ok) {
        const savedJourney = await response.json();
        
        // Update the journeyId if it's a new journey
        if (!journeyId) {
          setValue('journeyId', savedJourney.id);
        }
        
        // Update the saved journeys list
        setSavedJourneys(prev => {
          const index = prev.findIndex(j => j.id === savedJourney.id);
          if (index >= 0) {
            // Update existing journey
            const updated = [...prev];
            updated[index] = savedJourney;
            return updated;
          } else {
            // Add new journey
            return [...prev, savedJourney];
          }
        });
        
        alert('Journey saved successfully!');
      } else {
        throw new Error('Failed to save journey');
      }
    } catch (error) {
      console.error('Error saving journey:', error);
      alert('Failed to save journey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle reset confirmation
  const handleReset = () => {
    setShowResetModal(false);
    setValue('customJourneyEnabled', false);
    setValue('journeyPages', []);
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
              !!customJourneyEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className="sr-only">Use custom journey</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                !!customJourneyEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-900">
            {!!customJourneyEnabled 
              ? `Custom Journey Enabled: ${journeyName || 'Default Journey'}` 
              : 'Use Default Journey'}
          </span>
        </div>
      </div>
      
      {customJourneyEnabled && (
        <div className="space-y-6">
          {/* Journey Selection */}
          <div className="bg-white border rounded-md p-4">
            <label htmlFor="journeySelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Journey
            </label>

            {/* Show saved journeys with delete options */}
            {savedJourneys.length > 0 ? (
              <div className="space-y-3 mb-4">
                <p className="text-sm text-gray-500">Saved Journeys:</p>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {savedJourneys.map(journey => (
                    <div key={journey.id} className="py-2 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{journey.name}</p>
                        <p className="text-xs text-gray-500">
                          {journey.pages.length} pages
                          {journeyId === journey.id ? ' • Currently Selected' : ''}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleJourneySelect({ target: { value: journey.id } } as any)}
                          className={`px-2 py-1 text-xs rounded ${
                            journeyId === journey.id 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {journeyId === journey.id ? 'Selected' : 'Select'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteJourney(journey.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No saved journeys found.</p>
            )}

            <div className="flex space-x-4">
              <select
                id="journeySelect"
                value={journeyId || ''}
                onChange={handleJourneySelect}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">-- Select a journey --</option>
                {savedJourneys.map(journey => (
                  <option 
                    key={journey.id} 
                    value={journey.id}
                    // Add this to highlight the selected option in some browsers
                    selected={journey.id === journeyId}
                  >
                    {journey.name}
                  </option>
                ))}
                <option value="new">➕ Create New Journey</option>
              </select>
              
              <div className="flex flex-1 space-x-2">
                <input
                  type="text"
                  {...register('journeyName')}
                  placeholder="Journey Name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveJourney}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={isLoading || !journeyName.trim()}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
          
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
                      <FileUploadField
                        id={`background-image-${index}`}
                        name={`journeyPages.${index}.backgroundImage`}
                        label="Background Image"
                        accept="image/*"
                        helpText="Recommended size: 1920x1080px"
                        register={register}
                        setValue={setValue}
                        watch={watch}
                      />
                      
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
                    
                    <FileUploadField
                      id={`button-image-${index}`}
                      name={`journeyPages.${index}.buttonImage`}
                      label="Custom Button Image (optional)"
                      accept="image/*"
                      helpText="This will replace the text button with your custom image"
                      register={register}
                      setValue={setValue}
                      watch={watch}
                    />
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
        </div>
      )}
      
      {/* Create New Journey Modal */}
      {showCreateNewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Journey</h3>
            <div className="mb-4">
              <label htmlFor="newJourneyName" className="block text-sm font-medium text-gray-700 mb-1">
                Journey Name
              </label>
              <input
                id="newJourneyName"
                type="text"
                value={newJourneyName}
                onChange={(e) => setNewJourneyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="My Custom Journey"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateNewModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewJourney}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
              >
                Create
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Journey?</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this journey? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setJourneyToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteJourney}
                className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomJourneyTab;