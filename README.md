# Location Address Flow: A Location Management Platorm

<img width="1908" height="1723" alt="Location Flow Address" src="https://github.com/user-attachments/assets/b12a99ef-9440-4d0a-981a-06d661ddab9a" />

<p align="center">
  <img src="https://img.shields.io/github/license/rudraprasad69/Location-Address-Flow" alt="License">
  <img src="https://img.shields.io/github/stars/rudraprasad69/Location-Address-Flow" alt="Stars">
  <img src="https://img.shields.io/github/forks/rudraprasad69/Location-Address-Flow" alt="Forks">
  <img src="https://img.shields.io/github/issues/rudraprasad69/Location-Address-Flow" alt="Issues">
</p>

> A premium, modern web dashboard application designed to allow users to interactively search, select, geocode, and save locations. It integrates a high-performance map interface with a database-backed collection manager, presenting a seamless user experience for managing delivery, home, or office addresses.

## 🚀 Live Demo

A live version of the application is hosted here:
**https://location-address-flow.netlify.app
** 

## ✨ Features

Location Address Flow is a modern, web-based application designed to provide a highly reactive and visually intuitive location management experience. Key features include:

-   **Interactive Map & Geocoding:** Active location selection via a draggable marker with instant coordinate recalculation and smart reverse geocoding via Google Maps API.
-   **100% Uptime Fallback:** Automatic fallback to OpenStreetMap (Nominatim) if Google API quotas are exceeded.
-   **Location Management:** Dynamic color-coded pins for Home (🟠), Office (🔵), and Friends & Family (🟣) with global autocompletion search.
-   **Favorites System:** Quick-toggle heart buttons to flag priority locations.
-   **Auto-Pan Sync:** Clicking a saved address automatically centers the map viewport on that location.
-   **Premium UI/UX:** Custom slate-dark glassmorphic aesthetics that adapt seamlessly from a desktop view to a stacked mobile layout.

## 🛠️ Technologies Used

The application is built with a modern, component-based architecture for a modular and maintainable codebase.

<p align="left">
  <a href="https://reactjs.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="react" width="40" height="40"/> </a>
  <br>
  <br>
  <a href="https://nodejs.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="nodejs" width="40" height="40"/> </a>
  <br>
  <br>
  <a href="https://expressjs.com" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/express/express-original.svg" alt="express" width="40" height="40"/> </a>
  <br>
  <br>
  <a href="https://www.mongodb.com/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mongodb/mongodb-original.svg" alt="mongodb" width="40" height="40"/> </a>
</p>

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/rudraprasad69/Location-Address-Flow.git
```

### 2. Navigate to the project directory

```bash
cd Location-Address-Flow
```

### 3. Install backend dependencies

```bash
npm install
```

### 4. Install frontend dependencies

```bash
cd client
npm install
```

### 5. Create backend environment file

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/location-app
```

### 6. Create frontend environment file

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 7. Run the development server

```bash
npm run dev
```

### 8. Open the application

```text
http://localhost:3000
```
