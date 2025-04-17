// src/components/ui/DateRangePicker.tsx
"use client";
import React, { useState } from 'react';

interface DateRangePickerProps {
  onRangeChange: (startDate: Date, endDate: Date) => void;
  startDate: Date | null;
  endDate: Date | null;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onRangeChange,
  startDate,
  endDate,
}) => {
  const [start, setStart] = useState<string>(
    startDate ? startDate.toISOString().split('T')[0] : ''
  );
  const [end, setEnd] = useState<string>(
    endDate ? endDate.toISOString().split('T')[0] : ''
  );
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    if (!start || !end) {
      setError('Both start and end dates are required');
      return;
    }

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    if (endDateObj < startDateObj) {
      setError('End date cannot be earlier than start date');
      return;
    }

    setError(null);
    onRangeChange(startDateObj, endDateObj);
  };

  return (
    <div className="bg-white rounded-md border border-gray-300 p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="start-date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="end-date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-3">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply Range
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;