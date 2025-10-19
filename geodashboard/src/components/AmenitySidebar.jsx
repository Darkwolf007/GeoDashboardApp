
import React from 'react';
import { useDrag } from 'react-dnd';

// Accept darkMode prop for styling

const amenities = [
  { name: 'hospital', icon: 'hospital' },
  { name: 'metro', icon: 'metro' },
  { name: 'school', icon: 'school' },
  { name: 'University', icon: 'university' },
  { name: 'park', icon: 'park' },
  { name: 'office', icon: 'office' },
  { name: 'point of interest', icon: 'poi' },
  { name: 'landfill', icon: 'landfill' },
  { name: 'prison', icon: 'prison' },
  { name: 'highway', icon: 'highway' },
  { name: 'bar', icon: 'bar' },
  { name: 'cemetery', icon: 'cemetery' }
];

const amenityIconUrls = {
  hospital: {
    light: 'https://img.icons8.com/?size=100&id=4952&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=4952&format=png&color=ffd700',
  },
  metro: {
    light: 'https://img.icons8.com/?size=100&id=GoRj3K9i2RxQ&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=GoRj3K9i2RxQ&format=png&color=ffd700',
  },
  school: {
    light: 'https://img.icons8.com/?size=100&id=1954&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=1954&format=png&color=ffd700',
  },
  university: {
    light: 'https://img.icons8.com/?size=100&id=2341&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=2341&format=png&color=ffd700',
  },
  park: {
    light: 'https://img.icons8.com/?size=100&id=25703&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=25703&format=png&color=ffd700',
  },
  office: {
    light: 'https://img.icons8.com/?size=100&id=9166&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=9166&format=png&color=ffd700',
  },
  poi: {
    light: 'https://img.icons8.com/?size=100&id=12388&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=12388&format=png&color=ffd700',
  },
  landfill: {
    light: 'https://img.icons8.com/?size=100&id=4887&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=4887&format=png&color=ffd700',
  },
  prison: {
    light: 'https://img.icons8.com/?size=100&id=24833&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=24833&format=png&color=ffd700',
  },
  highway: {
    light: 'https://img.icons8.com/?size=100&id=107706&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=107706&format=png&color=ffd700',
  },
  bar: {
    light: 'https://img.icons8.com/?size=100&id=4925&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=4925&format=png&color=ffd700',
  },
  cemetery: {
    light: 'https://img.icons8.com/?size=100&id=4689&format=png&color=000000',
    dark: 'https://img.icons8.com/?size=100&id=4689&format=png&color=ffd700',
  },
};

const AmenityIcon = ({ amenity, darkMode }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'AMENITY',
    item: { name: amenity.name },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  let iconContent;
  if (amenityIconUrls[amenity.icon]) {
    const iconUrl = darkMode ? amenityIconUrls[amenity.icon].dark : amenityIconUrls[amenity.icon].light;
    iconContent = (
      <img src={iconUrl} alt={amenity.name} style={{ width: 32, height: 32, filter: isDragging ? 'opacity(0.5)' : 'none' }} />
    );
  } else {
    iconContent = amenity.icon;
  }
  return (
    <div
      ref={drag}
      style={{
        fontSize: '2em',
        margin: '10px 0',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
      title={amenity.name}
    >
      {iconContent}
    </div>
  );
};

const sidebarBg = (darkMode) => darkMode ? '#333' : '#fafafa';
const sidebarColor = (darkMode) => darkMode ? '#ffd700' : '#222';

const AmenitySidebar = ({ darkMode }) => (
  <div style={{ width: '80px', background: sidebarBg(darkMode), padding: '10px', color: sidebarColor(darkMode) }}>
    <h4 style={{ fontSize: '1em', marginBottom: '12px', color: sidebarColor(darkMode) }}>Amenities</h4>
    {amenities.map(a => (
      <AmenityIcon key={a.name} amenity={a} darkMode={darkMode} />
    ))}
  </div>
);

export default AmenitySidebar;
