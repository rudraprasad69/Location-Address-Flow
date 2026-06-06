import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import axios from 'axios';

const LIBRARIES = [];

const GoogleMapComponent = ({ location, setLocation, addresses = [], onSelectAddress, selectedAddress }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(true);

    clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const resp = await axios.get(`http://localhost:5002/api/search?q=${encodeURIComponent(value.trim())}`);
        setSearchResults(resp.data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  }, []);

  const handleSelectResult = (result) => {
    setLocation({ lat: result.latitude, lng: result.longitude });
    setSearchQuery(result.label.split(',').slice(0, 2).join(', '));
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  if (!isLoaded) {
    return (
      <div className="map-loader">
        <div className="spinner"></div>
        <span>Loading Map...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>

      {/* ── Custom Search Bar ── */}
      <div className="map-search-wrapper" ref={wrapperRef}>
        <div className="map-search-inner">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="map-search-input"
            placeholder="Search for a city, landmark or address..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            autoComplete="off"
          />
          {isSearching && <div className="search-spinner"></div>}
          {searchQuery && !isSearching && (
            <button className="search-clear-btn" onClick={handleClearSearch} title="Clear search">✕</button>
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && (searchResults.length > 0 || isSearching) && (
          <ul className="map-search-results">
            {isSearching && searchResults.length === 0 && (
              <li className="search-result-loading">
                <div className="mini-spinner"></div>
                <span>Searching locations...</span>
              </li>
            )}
            {searchResults.map((result, idx) => (
              <li
                key={idx}
                className="search-result-item"
                onMouseDown={() => handleSelectResult(result)}
              >
                <span className="result-pin">📍</span>
                <div className="result-text">
                  <span className="result-primary">
                    {result.label.split(',')[0]}
                  </span>
                  <span className="result-secondary">
                    {result.label.split(',').slice(1, 3).join(',').trim()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Google Map ── */}
      <GoogleMap
        zoom={14}
        center={location}
        mapContainerStyle={{ height: '100%', width: '100%' }}
        onClick={(e) => setLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: 9 },
        }}
      >
        {/* Main Selection Marker — draggable */}
        <Marker
          position={location}
          draggable={true}
          onDragEnd={(e) => setLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
          icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
          title="Drag to pinpoint your location"
        />

        {/* Saved Address Markers */}
        {addresses.map((addr) => {
          if (!addr.latitude || !addr.longitude) return null;
          const isSelected = selectedAddress && selectedAddress._id === addr._id;

          let iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
          if (isSelected)                         iconUrl = 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
          else if (addr.category === 'Home')      iconUrl = 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png';
          else if (addr.category === 'Office')    iconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
          else if (addr.category === 'Friends & Family') iconUrl = 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';

          return (
            <Marker
              key={addr._id}
              position={{ lat: addr.latitude, lng: addr.longitude }}
              onClick={() => onSelectAddress(addr)}
              title={`${addr.category}: ${addr.house}, ${addr.road}`}
              icon={{ url: iconUrl }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapComponent;
