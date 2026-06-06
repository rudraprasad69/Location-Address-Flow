import React, { useState, useEffect } from 'react';
import GoogleMapComponent from './components/GoogleMapComponent';
import AddressForm from './components/AddressForm';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL !== undefined ? process.env.REACT_APP_API_URL : 'http://localhost:5002';

const App = () => {
  // Center map on standard default (New York) first, updated by Geolocation
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [suggestedAddress, setSuggestedAddress] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE}/addresses`);
      setAddresses(response.data);
    } catch (err) {
      console.error('Failed to fetch addresses');
    }
  };

  // Get current location on component mount
  useEffect(() => {
    fetchAddresses();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation permission denied or error. Using default location.');
        }
      );
    }
  }, []);

  // Fetch geocoded address when location changes (debounced by 400ms)
  useEffect(() => {
    if (location.lat === 0 && location.lng === 0) return;

    const geocodeLocation = async () => {
      setIsGeocoding(true);
      try {
        const response = await axios.get(`${API_BASE}/api/geocode?lat=${location.lat}&lng=${location.lng}`);
        setSuggestedAddress(response.data);
      } catch (err) {
        console.error('Failed to geocode location', err);
      } finally {
        setIsGeocoding(false);
      }
    };

    const timer = setTimeout(() => {
      geocodeLocation();
    }, 400);

    return () => clearTimeout(timer);
  }, [location.lat, location.lng]);

  const handleViewOnMap = (address) => {
    setSelectedAddress(address);
    setLocation({ lat: address.latitude, lng: address.longitude });
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await axios.delete(`${API_BASE}/addresses/${id}`);
        fetchAddresses();
        if (selectedAddress && selectedAddress._id === id) {
          setSelectedAddress(null);
        }
      } catch (err) {
        console.error('Failed to delete address', err);
      }
    }
  };

  const handleToggleFavorite = async (address, e) => {
    e.stopPropagation();
    try {
      await axios.put(`${API_BASE}/addresses/${address._id}`, {
        isFavorite: !address.isFavorite
      });
      fetchAddresses();
      if (selectedAddress && selectedAddress._id === address._id) {
        setSelectedAddress(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
      }
    } catch (err) {
      console.error('Failed to toggle favorite status', err);
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1>Location Address Flow</h1>
      </header>
      <div className="main-content">
        <div className="map-form-container">
          <div className="map-container">
            <GoogleMapComponent 
              location={location} 
              setLocation={setLocation} 
              addresses={addresses}
              onSelectAddress={handleViewOnMap}
              selectedAddress={selectedAddress}
            />
          </div>
          <AddressForm 
            location={location} 
            fetchAddresses={fetchAddresses} 
            suggestedAddress={suggestedAddress}
            isGeocoding={isGeocoding}
          />
        </div>
        <div className="address-list-container">
          <h2 className="address-list-title">Saved Addresses</h2>
          <ul className="address-list">
            {addresses.map((address) => {
              const badgeClass = address.category === 'Home' ? 'badge-home' : address.category === 'Office' ? 'badge-office' : 'badge-friends';
              const categoryIcon = address.category === 'Home' ? '🏠' : address.category === 'Office' ? '🏢' : '👥';
              return (
                <li 
                  key={address._id} 
                  className={`address-item ${selectedAddress && selectedAddress._id === address._id ? 'selected' : ''}`}
                  onClick={() => handleViewOnMap(address)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="address-info">
                    <div className="address-title-row">
                      <span className="house-value">{address.house}</span>
                      <button 
                        className="favorite-btn" 
                        onClick={(e) => handleToggleFavorite(address, e)}
                        title={address.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      >
                        {address.isFavorite ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <span className="address-info-row"><strong>Road:</strong> {address.road}</span>
                    <span className={`category-badge ${badgeClass}`}>{categoryIcon} {address.category}</span>
                  </div>
                  <div className="address-actions">
                    <button 
                      className="view-btn" 
                      onClick={(e) => { e.stopPropagation(); handleViewOnMap(address); }}
                    >
                      View on Map
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={(e) => handleDeleteAddress(address._id, e)}
                      title="Delete Address"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              );
            })}
            {addresses.length === 0 && (
              <div className="no-addresses">
                <p>No saved addresses yet. Select a location on the map and save it above!</p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;

