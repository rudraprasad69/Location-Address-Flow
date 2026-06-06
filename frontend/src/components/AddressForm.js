import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL !== undefined ? process.env.REACT_APP_API_URL : 'http://localhost:5002';

const AddressForm = ({ location, fetchAddresses, suggestedAddress, isGeocoding }) => {
  const [form, setForm] = useState({ category: '', house: '', road: '', isFavorite: false });
  const [error, setError] = useState(null);

  // Auto-populate form fields when a suggested address is received from geocoding
  useEffect(() => {
    if (suggestedAddress) {
      setForm(prev => ({
        ...prev,
        house: suggestedAddress.house || prev.house,
        road: suggestedAddress.road || prev.road
      }));
    }
  }, [suggestedAddress]);

  const saveAddress = async () => {
    try {
      if (!form.category || !form.house || !form.road) {
        setError('All fields are required');
        return;
      }
      await axios.post(`${API_BASE}/addresses`, { ...form, latitude: location.lat, longitude: location.lng });
      setError(null);
      // Reset form after saving
      setForm({ category: '', house: '', road: '', isFavorite: false });
      fetchAddresses(); // This will refresh the address list
    } catch (err) {
      setError('Failed to save address');
    }
  };

  return (
    <form className="form-container" onSubmit={(e) => { e.preventDefault(); saveAddress(); }}>
      <h3 className="form-title">Save Your Address</h3>
      
      {/* Real-time geocoding resolution status */}
      {isGeocoding ? (
        <div className="geocoding-indicator">
          <div className="mini-spinner"></div>
          <span>Resolving address from coordinates...</span>
        </div>
      ) : suggestedAddress && suggestedAddress.formatted_address ? (
        <div className="geocoding-indicator success">
          <span className="geo-icon">📍</span>
          <span className="geo-text" title={suggestedAddress.formatted_address}>
            {suggestedAddress.formatted_address}
          </span>
        </div>
      ) : (
        <div className="geocoding-indicator info">
          <span className="geo-icon">🗺️</span>
          <span className="geo-text">
            Pin location on map to auto-fill address
          </span>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
      
      <div className="form-group">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="House/Flat/Block No."
            value={form.house}
            onChange={(e) => setForm({ ...form, house: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Apartment/Road/Area"
            value={form.road}
            onChange={(e) => setForm({ ...form, road: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="input-wrapper">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="form-input"
          >
            <option value="">Select Category</option>
            <option value="Home">Home</option>
            <option value="Office">Office</option>
            <option value="Friends & Family">Friends & Family</option>
          </select>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.isFavorite}
            onChange={(e) => setForm({ ...form, isFavorite: e.target.checked })}
            className="form-checkbox"
          />
          <span className="checkbox-custom"></span>
          Save as Favorite
        </label>
      </div>

      <button type="submit" className="submit-btn">Save Address</button>
    </form>
  );
};

export default AddressForm;

