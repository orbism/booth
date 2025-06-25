// src/components/booth/FiltersSelector.tsx
import React, { useEffect } from 'react';
import { AVAILABLE_FILTERS } from '../forms/tabs/FiltersTab';

interface FiltersSelectorProps {
  enabledFilters: string[];
  onSelectFilter: (filterId: string) => void;
  onConfirm: () => void;
  videoElement: HTMLVideoElement | null;
  selectedFilter: string;
}

const FiltersSelector: React.FC<FiltersSelectorProps> = ({
  enabledFilters,
  onSelectFilter,
  onConfirm,
  videoElement,
  selectedFilter
}) => {
  // Get only the filters that are enabled
  const activeFilters = AVAILABLE_FILTERS.filter(
    filter => filter.id === 'normal' || enabledFilters.includes(filter.id)
  );

  // Apply the selected filter to the video element
  useEffect(() => {
    if (videoElement) {
      const filterCSS = AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css || '';
      videoElement.style.filter = filterCSS;
    }
  }, [selectedFilter, videoElement]);

  return (
    <div className="absolute inset-0 z-10">
      {/* Confirm button - positioned at the top right of the container */}
      <button
        onClick={onConfirm}
        className="absolute top-4 right-4 z-30 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        Use this filter
      </button>
      
      {/* Filters carousel - with transparent background */}
      <div className="absolute bottom-0 left-0 right-0 z-30 py-3">
        <div className="flex overflow-x-auto px-4 space-x-3 pb-2">
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              onClick={() => onSelectFilter(filter.id)}
              className={`flex-shrink-0 cursor-pointer transition-all ${
                selectedFilter === filter.id ? 'scale-110 transform' : ''
              }`}
            >
              <div 
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 relative ${
                  selectedFilter === filter.id ? 'border-white' : 'border-transparent'
                }`}
              >
                {/* Preview image with filter applied */}
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(/filterthumb.png)`,
                    filter: filter.css 
                  }}
                ></div>
                
                {/* Label inside the thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                  {filter.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FiltersSelector;