// src/components/forms/tabs/FiltersTab.tsx
import React from 'react';
import { UseFormWatch, UseFormSetValue, UseFormRegister, FieldErrors } from 'react-hook-form';
import { SettingsFormValues } from '../SettingsForm';
import { useTheme } from '@/context/ThemeContext';
import Tooltip from '@/components/ui/Tooltip';

// Define our available filters
export const AVAILABLE_FILTERS = [
  { id: 'normal', name: 'Normal', css: '' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
  { id: 'grayscale', name: 'Black & White', css: 'grayscale(100%)' },
  { id: 'saturate', name: 'Vibrant', css: 'saturate(200%)' },
  { id: 'contrast', name: 'High Contrast', css: 'contrast(150%)' },
  { id: 'invert', name: 'Invert', css: 'invert(100%)' },
  { id: 'blur', name: 'Soft Focus', css: 'blur(2px)' },
  { id: 'hue-rotate', name: 'Color Shift', css: 'hue-rotate(180deg)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(50%) hue-rotate(-30deg) saturate(140%)' },
];

interface FiltersTabProps {
  register: UseFormRegister<SettingsFormValues>;
  watch: UseFormWatch<SettingsFormValues>;
  setValue: UseFormSetValue<SettingsFormValues>;
  errors: FieldErrors<SettingsFormValues>;
}

const FiltersTab: React.FC<FiltersTabProps> = ({
  register,
  watch,
  setValue,
  errors
}) => {
  const { buttonColor } = useTheme();
  
  const filtersEnabled = watch('filtersEnabled');
  const enabledFiltersStr = watch('enabledFilters');
  
  // Parse the enabled filters from JSON
  const enabledFilters = React.useMemo(() => {
    if (!enabledFiltersStr) return ['normal'];
    try {
      return JSON.parse(enabledFiltersStr);
    } catch (e) {
      console.error('Failed to parse enabled filters:', e);
      return ['normal'];
    }
  }, [enabledFiltersStr]);
  
  // Toggle a filter on/off
  const toggleFilter = (filterId: string) => {
    if (filterId === 'normal') return; // Normal is always enabled
    
    const newEnabledFilters = [...enabledFilters];
    const index = newEnabledFilters.indexOf(filterId);
    
    if (index > -1) {
      // Remove filter if already enabled
      newEnabledFilters.splice(index, 1);
    } else {
      // Add filter if not already enabled
      newEnabledFilters.push(filterId);
    }
    
    setValue('enabledFilters', JSON.stringify(newEnabledFilters));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Photo Filters</h3>
      
      <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
        <h4 className="text-base font-medium text-blue-800 mb-4">Enable Photo Filters</h4>
        <p className="text-sm text-blue-700 mb-4">
          Allow users to apply filters to their photos for creative effects.
          When enabled, users will be able to choose from a selection of filters before taking their photo.
        </p>
        
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setValue('filtersEnabled', !filtersEnabled)}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
              filtersEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            style={{ backgroundColor: filtersEnabled ? buttonColor : undefined }}
          >
            <span className="sr-only">Enable filters</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                filtersEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="ml-3 text-sm font-medium text-gray-900">
            {filtersEnabled ? 'Filters Enabled' : 'Filters Disabled'}
          </span>
        </div>
      </div>
      
      {filtersEnabled && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-800">Available Filters</h4>
            <Tooltip 
              content="Select which filters will be available to users. 'Normal' is always enabled."
              position="left"
            >
              <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </Tooltip>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {AVAILABLE_FILTERS.map((filter) => (
                <div key={filter.id} className="relative">
                  <input
                    type="checkbox"
                    id={`filter-${filter.id}`}
                    checked={filter.id === 'normal' || enabledFilters.includes(filter.id)}
                    disabled={filter.id === 'normal'} // Normal is always enabled
                    onChange={() => toggleFilter(filter.id)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`filter-${filter.id}`}
                    className={`block cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                      filter.id === 'normal' || enabledFilters.includes(filter.id)
                        ? 'border-blue-500 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      borderColor: (filter.id === 'normal' || enabledFilters.includes(filter.id)) 
                        ? buttonColor 
                        : undefined
                    }}
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {/* Filter preview image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ 
                          backgroundImage: 'url(/images/filter-preview.jpg)', 
                          filter: filter.css 
                        }}
                      ></div>
                      
                      {/* Checkmark for selected filters */}
                      {(filter.id === 'normal' || enabledFilters.includes(filter.id)) && (
                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1" style={{ backgroundColor: buttonColor }}>
                          <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-center">
                      <span className="text-sm font-medium">{filter.name}</span>
                      {filter.id === 'normal' && <span className="block text-xs text-gray-500">(always enabled)</span>}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <p className="mt-2 text-sm text-gray-500">
            The selected filters will be available for users to choose from before taking a photo.
            Make sure to save settings after making changes.
          </p>
        </div>
      )}
    </div>
  );
};

export default FiltersTab;