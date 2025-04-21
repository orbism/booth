// src/components/booth/FiltersSelector.tsx
import React, { useState, useEffect } from 'react';
import { AVAILABLE_FILTERS } from '../forms/tabs/FiltersTab';

interface FiltersSelectorProps {
  enabledFilters: string[];
  onSelectFilter: (filterId: string) => void;
  onConfirm: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const FiltersSelector: React.FC<FiltersSelectorProps> = ({
  enabledFilters,
  onSelectFilter,
  onConfirm,
  videoRef
}) => {
  const [selectedFilter, setSelectedFilter] = useState('normal');
  
  // Handle filter selection
  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    onSelectFilter(filterId);
  };
  
  // Get only the filters that are enabled
  const activeFilters = AVAILABLE_FILTERS.filter(
    filter => filter.id === 'normal' || enabledFilters.includes(filter.id)
  );

  return (
    <div className="relative w-full">
      {/* Filter applied to the video preview */}
      {videoRef?.current && (
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{ filter: AVAILABLE_FILTERS.find(f => f.id === selectedFilter)?.css || '' }}
        />
      )}
      
      {/* Confirm button */}
      <button
        onClick={onConfirm}
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        Use this filter
      </button>
      
      {/* Filters carousel */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black bg-opacity-50 py-3">
        <div className="flex overflow-x-auto px-4 space-x-3 pb-2">
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              onClick={() => handleFilterSelect(filter.id)}
              className={`flex-shrink-0 cursor-pointer transition-all ${
                selectedFilter === filter.id ? 'scale-110 transform' : ''
              }`}
            >
              <div 
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                  selectedFilter === filter.id ? 'border-white' : 'border-transparent'
                }`}
              >
                <div 
                  className="w-full h-full bg-gray-400"
                  style={{ filter: filter.css }}
                ></div>
              </div>
              <div className="text-center text-white text-xs mt-1">
                {filter.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FiltersSelector;