'use client';

import { useState } from 'react';

interface LocationSearchProps {
  onLocationSubmit: (data: { latitude?: number; longitude?: number; locationName?: string }) => void;
  isLoading: boolean;
}

export default function LocationSearch({ onLocationSubmit, isLoading }: LocationSearchProps) {
  const [searchType, setSearchType] = useState<'coordinates' | 'name'>('name');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (searchType === 'coordinates') {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lon)) {
        setError('Please enter valid coordinates');
        return;
      }
      
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setError('Coordinates out of range');
        return;
      }
      
      onLocationSubmit({ latitude: lat, longitude: lon });
    } else {
      if (!locationName.trim()) {
        setError('Please enter a location name');
        return;
      }
      
      onLocationSubmit({ locationName: locationName.trim() });
    }
  };

  const handleExampleClick = (type: 'coordinates' | 'name', data: any) => {
    if (type === 'coordinates') {
      setSearchType('coordinates');
      setLatitude(data.lat.toString());
      setLongitude(data.lon.toString());
    } else {
      setSearchType('name');
      setLocationName(data.name);
    }
  };

  return (
    <div className="card">
      <h3>
        <i className="fas fa-map-marker-alt"></i> Analyze Location
      </h3>
      
      <div className="location-type-selector">
        <button
          type="button"
          className={`control-btn ${searchType === 'name' ? 'active' : ''}`}
          onClick={() => setSearchType('name')}
          disabled={isLoading}
        >
          <i className="fas fa-search"></i> Place Name
        </button>
        <button
          type="button"
          className={`control-btn ${searchType === 'coordinates' ? 'active' : ''}`}
          onClick={() => setSearchType('coordinates')}
          disabled={isLoading}
        >
          <i className="fas fa-crosshairs"></i> Coordinates
        </button>
      </div>

      <form onSubmit={handleSubmit} className="location-form">
        {searchType === 'name' ? (
          <div className="input-group">
            <label htmlFor="locationName">Location Name</label>
            <input
              id="locationName"
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g., Pentagon, Washington DC"
              className="location-input"
              disabled={isLoading}
            />
            <small className="input-hint">
              Enter city, address, or landmark name
            </small>
          </div>
        ) : (
          <div className="coordinates-grid">
            <div className="input-group">
              <label htmlFor="latitude">Latitude</label>
              <input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 40.7128"
                className="location-input"
                disabled={isLoading}
              />
            </div>
            <div className="input-group">
              <label htmlFor="longitude">Longitude</label>
              <input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -74.0060"
                className="location-input"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="btn location-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="btn-spinner"></div>
              Analyzing...
            </>
          ) : (
            <>
              <i className="fas fa-satellite"></i>
              Analyze Satellite Image
            </>
          )}
        </button>

        {error && (
          <div className="error" style={{ display: 'block' }}>
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
      </form>

      <div className="location-examples">
        <h4>Example Locations:</h4>
        <div className="example-buttons">
          <button
            type="button"
            className="example-btn"
            onClick={() => handleExampleClick('name', { name: 'Pentagon, Washington DC' })}
            disabled={isLoading}
          >
            <i className="fas fa-shield-alt"></i> Pentagon
          </button>
          <button
            type="button"
            className="example-btn"
            onClick={() => handleExampleClick('coordinates', { lat: 28.6139, lon: 77.2090 })}
            disabled={isLoading}
          >
            <i className="fas fa-landmark"></i> New Delhi
          </button>
          <button
            type="button"
            className="example-btn"
            onClick={() => handleExampleClick('name', { name: 'Mumbai Port, India' })}
            disabled={isLoading}
          >
            <i className="fas fa-ship"></i> Mumbai Port
          </button>
          <button
            type="button"
            className="example-btn"
            onClick={() => handleExampleClick('coordinates', { lat: 40.7128, lon: -74.0060 })}
            disabled={isLoading}
          >
            <i className="fas fa-city"></i> New York
          </button>
        </div>
      </div>
    </div>
  );
}