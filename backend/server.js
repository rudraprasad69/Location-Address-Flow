const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Strip Netlify Functions prefix if present
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '');
  }
  next();
});

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 3000,
  bufferCommands: false,
})
  .then(() => console.log('✅ Database connected successfully'))
  .catch((err) => console.warn('⚠️  MongoDB unavailable – address save/load will not work until MongoDB is started. Search & geocoding still work.\n', err.message));

const AddressSchema = new mongoose.Schema({
  category: { type: String, required: true },
  house: { type: String, required: true },
  road: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  isFavorite: { type: Boolean, default: false },
});

const Address = mongoose.model('Address', AddressSchema);

// ─── Helper: HTTPS GET as Promise ─────────────────────────────────────────────
const httpsGet = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    const options = new URL(url);
    const reqOptions = {
      hostname: options.hostname,
      path: options.pathname + options.search,
      headers: {
        'User-Agent': 'LocationAddressFlow/1.0 (educational project)',
        ...headers,
      },
    };
    https.get(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    }).on('error', reject);
  });

// ─── Nominatim Reverse Geocode ─────────────────────────────────────────────────
const nominatimReverse = async (lat, lng) => {
  const data = await httpsGet(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
  );
  if (!data || data.error) throw new Error('Nominatim reverse geocode failed');

  const addr = data.address || {};
  const house =
    addr.house_number ||
    addr.building ||
    'Flat ' + (Math.floor(Math.abs(parseFloat(lat)) * 1000) % 100 + 1);

  const road =
    addr.road ||
    addr.pedestrian ||
    addr.footway ||
    addr.neighbourhood ||
    addr.suburb ||
    addr.city_district ||
    addr.county ||
    data.display_name.split(',')[0];

  return {
    house,
    road,
    formatted_address: data.display_name,
  };
};

// ─── POST /addresses ───────────────────────────────────────────────────────────
app.post('/addresses', async (req, res) => {
  try {
    const { category, house, road, latitude, longitude } = req.body;
    if (!category || !house || !road || latitude === undefined || longitude === undefined) {
      return res.status(400).send({ error: 'All fields are required' });
    }
    const address = new Address(req.body);
    await address.save();
    res.status(201).send(address);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// ─── GET /addresses ────────────────────────────────────────────────────────────
app.get('/addresses', async (req, res) => {
  try {
    const addresses = await Address.find();
    res.send(addresses);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ─── GET /api/geocode ─────────────────────────────────────────────── (with Nominatim fallback)
app.get('/api/geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).send({ error: 'Latitude and longitude are required' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let googleDenied = !apiKey || apiKey.startsWith('your_');

    // Try Google Maps first (if key looks valid)
    if (!googleDenied) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        const data = await httpsGet(url);

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const firstResult = data.results[0];
          const components = firstResult.address_components;
          let house = '', road = '', sublocality = '', neighborhood = '';

          for (const component of components) {
            const types = component.types;
            if (types.includes('street_number')) house = component.long_name;
            else if (types.includes('route')) road = component.long_name;
            else if (types.includes('sublocality') || types.includes('sublocality_level_1')) sublocality = component.long_name;
            else if (types.includes('neighborhood')) neighborhood = component.long_name;
          }

          if (!road) road = neighborhood || sublocality || firstResult.formatted_address.split(',')[0];
          if (!house) house = 'Flat ' + (Math.floor(Math.abs(parseFloat(lat)) * 1000) % 100 + 1);

          return res.send({ house, road, formatted_address: firstResult.formatted_address });
        } else {
          googleDenied = true; // billing error or no results — fall through to Nominatim
        }
      } catch (_) {
        googleDenied = true;
      }
    }

    // ── Nominatim Fallback ────────────────────────────────────────────────────
    try {
      const result = await nominatimReverse(lat, lng);
      return res.send(result);
    } catch (_) {
      // Last resort: simulated
      return res.send({
        house: `Flat ${Math.floor(Math.abs(parseFloat(lat)) * 100) % 500 + 1}`,
        road: `Area ${Math.floor(Math.abs(parseFloat(lng)) * 100) % 100 + 1}`,
        formatted_address: `Location near ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`,
      });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ─── GET /api/search ─────────────────────────────────────────── (Nominatim text search)
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.send([]);
    }

    const encoded = encodeURIComponent(q.trim());
    const data = await httpsGet(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=6`
    );

    if (!Array.isArray(data)) return res.send([]);

    const results = data.map((item) => ({
      label: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      class: item.class,
    }));

    res.send(results);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ─── PUT /addresses/:id ────────────────────────────────────────────────────────
app.put('/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const address = await Address.findByIdAndUpdate(id, updates, { new: true });
    if (!address) return res.status(404).send({ error: 'Address not found' });
    res.send(address);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// ─── DELETE /addresses/:id ─────────────────────────────────────────────────────
app.delete('/addresses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findByIdAndDelete(id);
    if (!address) return res.status(404).send({ error: 'Address not found' });
    res.send(address);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 5002;
if (!process.env.NETLIFY) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
