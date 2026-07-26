'use client';

import { useState } from 'react';

export function GpsField({
  lat,
  lng,
  onChange,
}: {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocateError('Your browser does not support location detection.');
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(position.coords.latitude.toFixed(6), position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocateError('Could not get your location. You can enter coordinates manually instead.');
        setLocating(false);
      }
    );
  }

  const hasCoords = lat.trim() !== '' && lng.trim() !== '';

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-ink mb-1.5">GPS coordinates</label>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <input
          type="number"
          step="any"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => onChange(e.target.value, lng)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        />
        <input
          type="number"
          step="any"
          placeholder="Longitude"
          value={lng}
          onChange={(e) => onChange(lat, e.target.value)}
          className="w-full rounded-md border border-rule bg-white px-3 py-2 text-ink focus:border-forest focus:ring-1 focus:ring-forest"
        />
      </div>
      <div className="flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="text-forest hover:underline disabled:opacity-50"
        >
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
        {hasCoords && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:underline"
          >
            View on map ↗
          </a>
        )}
      </div>
      {locateError && <p className="text-sm text-red-700 mt-1">{locateError}</p>}
    </div>
  );
}
