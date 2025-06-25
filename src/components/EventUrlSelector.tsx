import React, { useState, useEffect } from 'react';
import { EventUrl } from '@prisma/client';

interface EventUrlSelectorProps {
  eventUrls: EventUrl[];
  selectedEventUrlId: string | null;
  onEventUrlChange: (eventUrlId: string | null) => void;
  isLoading?: boolean;
}

/**
 * Component for selecting an event URL to edit settings for
 */
export default function EventUrlSelector({
  eventUrls,
  selectedEventUrlId,
  onEventUrlChange,
  isLoading = false
}: EventUrlSelectorProps) {
  const [availableUrls, setAvailableUrls] = useState<EventUrl[]>([]);

  // Update available URLs when the prop changes
  useEffect(() => {
    if (eventUrls && eventUrls.length > 0) {
      setAvailableUrls(eventUrls);
    }
  }, [eventUrls]);

  // If there's no selected ID but we have URLs, select the first one
  useEffect(() => {
    if (!selectedEventUrlId && availableUrls.length > 0 && !isLoading) {
      onEventUrlChange(availableUrls[0].id);
    }
  }, [selectedEventUrlId, availableUrls, isLoading, onEventUrlChange]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // "default" means use the general user settings, not event-specific
    onEventUrlChange(value === "default" ? null : value);
  };

  if (isLoading) {
    return (
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <p className="text-gray-500">Loading event URLs...</p>
      </div>
    );
  }

  if (!availableUrls || availableUrls.length === 0) {
    return (
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <p className="text-gray-500">You don't have any event URLs yet.</p>
        <p className="text-sm mt-2">
          Create an event URL first to customize settings for it.
        </p>
      </div>
    );
  }

  // Find the currently selected URL details
  const selectedUrl = selectedEventUrlId 
    ? availableUrls.find(url => url.id === selectedEventUrlId)
    : null;

  return (
    <div className="mb-6 p-4 border rounded bg-gray-50">
      <div className="mb-4">
        <label htmlFor="event-url-selector" className="block font-medium mb-1">
          Select Event URL to Configure
        </label>
        <select
          id="event-url-selector"
          className="w-full p-2 border rounded"
          value={selectedEventUrlId || "default"}
          onChange={handleChange}
        >
          <option value="default">General Settings (apply to all URLs)</option>
          {availableUrls.map(u => (
            <option key={u.id} value={u.id}>
              {u.eventName} ({u.urlPath})
            </option>
          ))}
        </select>
      </div>

      {selectedUrl && (
        <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
          <p className="font-medium">Currently editing settings for:</p>
          <p className="mt-1">
            <strong>Event:</strong> {selectedUrl.eventName}
          </p>
          <p>
            <strong>URL Path:</strong> {selectedUrl.urlPath}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Changes will only apply to this specific URL.
          </p>
        </div>
      )}

      {!selectedEventUrlId && (
        <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
          <p className="font-medium">Editing general settings</p>
          <p className="mt-1 text-gray-600">
            These settings will apply to all your event URLs that don't have specific settings.
          </p>
        </div>
      )}
    </div>
  );
} 