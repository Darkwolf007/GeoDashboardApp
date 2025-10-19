// HousingTypeDropdown.jsx
import React from 'react';
const HousingTypeDropdown = ({ housingType, setHousingType, selectedArea }) => {
  // Get available room types from selectedArea.ActualPrice
  const options = selectedArea && selectedArea.ActualPrice
    ? Object.keys(selectedArea.ActualPrice)
    : ['1 B/R', '2 B/R', '3 B/R', '4 B/R', '5 B/R', 'Studio'];
  return (
    <select value={housingType} onChange={e => setHousingType(e.target.value)}>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};

export default HousingTypeDropdown;
