// Main App component for Geodashboard
import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import HousingTypeDropdown from './components/HousingTypeDropdown';
import AmenitySidebar from './components/AmenitySidebar';
import ForecastChart from './components/ForecastChart';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000/predict'; // Update if backend is hosted elsewhere

const App = () => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [housingType, setHousingType] = useState('1BHK');
  const [amenities, setAmenities] = useState([]);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    // Only send request if area and housing type are selected
    if (!selectedArea || !housingType) return;
    const fetchForecast = async () => {
      try {
        const res = await axios.post(BACKEND_URL, {
          area: selectedArea,
          housing_type: housingType,
          amenities: amenities,
        });
        setForecast(res.data.forecast);
      } catch (err) {
        setForecast([]);
        console.error('Error fetching forecast:', err);
      }
    };
    fetchForecast();
  }, [selectedArea, housingType, amenities]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <AmenitySidebar amenities={amenities} setAmenities={setAmenities} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <MapView selectedArea={selectedArea} setSelectedArea={setSelectedArea} amenities={amenities} />
        <HousingTypeDropdown housingType={housingType} setHousingType={setHousingType} />
        <ForecastChart forecast={forecast} />
      </div>
    </div>
  );
};

export default App;
