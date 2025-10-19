// MapView.jsx


import React, { useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
const GEOJSON_URL = process.env.PUBLIC_URL + '/final_vis.json';

const MapView = ({ selectedArea, setSelectedArea, amenities, setAmenities }) => {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState(null);

  // DnD drop logic
  const [, drop] = useDrop({
    accept: 'AMENITY',
    drop: (item) => {
      if (!selectedArea) return;
      if (!amenities.includes(item.name)) {
        setAmenities([...amenities, item.name]);
      }
    },
  });

  useEffect(() => {
    let map;
    let dataLayer;
    if (!window.google || !window.google.maps) {
      setError('Google Maps API not loaded.');
      setLoading(false);
      return;
    }
    map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 25.2048, lng: 55.2708 }, // Dubai
      zoom: 10,
    });
    fetch(GEOJSON_URL)
      .then(res => {
        if (!res.ok) throw new Error('GeoJSON fetch failed');
        return res.json();
      })
      .then(geojson => {
        setLoading(false);
        if (!geojson || !geojson.features || geojson.features.length === 0) {
          setError('GeoJSON loaded but no features found.');
          return;
        }
        dataLayer = new window.google.maps.Data();
        dataLayer.addGeoJson(geojson);
        // Use a unique property (e.g., AreaName + ZoneIndex) as feature ID if getId is not set
        const getFeatureId = feature => {
          if (feature.getId) return feature.getId();
          const area = feature.getProperty('AreaName');
          const zone = feature.getProperty('ZoneIndex');
          return area + '_' + zone;
        };
        dataLayer.setStyle(feature => {
          const isSelected = getFeatureId(feature) === selectedFeatureId;
          return {
            fillColor: isSelected ? '#FFD700' : '#088',
            strokeColor: '#000',
            strokeWeight: 2,
            fillOpacity: isSelected ? 0.7 : 0.4,
            clickable: true,
          };
        });
        dataLayer.setMap(map);
        // Fit bounds to geojson
        const bounds = new window.google.maps.LatLngBounds();
        dataLayer.forEach(feature => {
          feature.getGeometry().forEachLatLng(latlng => bounds.extend(latlng));
        });
        map.fitBounds(bounds);
        // Area click handler
        dataLayer.addListener('click', e => {
          const props = {};
          e.feature.forEachProperty((value, key) => {
            props[key] = value;
          });
          // Parse ActualPrice JSON if present (concatenated objects)
          if (props.ActualPrice && typeof props.ActualPrice === 'string') {
            try {
              // Split by }{ and fix to valid JSON array
              const parts = props.ActualPrice.replace(/}{/g, '}|{').split('|');
              const roomDict = {};
              parts.forEach(part => {
                const obj = JSON.parse(part);
                Object.keys(obj).forEach(room => {
                  roomDict[room] = obj[room];
                });
              });
              props.ActualPrice = roomDict;
            } catch (err) {
              props.ActualPrice = {};
            }
          }
          // Parse PredictPrice JSON if present and is a string (concatenated objects)
          if (props.PredictPrice && typeof props.PredictPrice === 'string') {
            try {
              // Split by }{ and fix to valid JSON array
              const parts = props.PredictPrice.replace(/}{/g, '}|{').split('|');
              const roomDict = {};
              parts.forEach(part => {
                const obj = JSON.parse(part);
                Object.keys(obj).forEach(room => {
                  roomDict[room] = obj[room];
                });
              });
              props.PredictPrice = roomDict;
            } catch (err) {
              props.PredictPrice = {};
            }
          }
          // Parse amenities JSON if present and is a string
          if (props.amenities && typeof props.amenities === 'string') {
            try {
              props.amenities = JSON.parse(props.amenities);
            } catch (err) {
              props.amenities = {};
            }
          }
          // Use unique property as feature ID
          const area = e.feature.getProperty('AreaName');
          const zone = e.feature.getProperty('ZoneIndex');
          const featureId = area + '_' + zone;
          setSelectedFeatureId(featureId);
          setSelectedArea(props);
          // Re-style to highlight selection
          dataLayer.setStyle(feature => {
            const isSelected = (feature.getProperty('AreaName') + '_' + feature.getProperty('ZoneIndex')) === featureId;
            return {
              fillColor: isSelected ? '#FFD700' : '#088',
              strokeColor: '#000',
              strokeWeight: 2,
              fillOpacity: isSelected ? 0.7 : 0.4,
              clickable: true,
            };
          });
        });
      })
      .catch(err => {
        setLoading(false);
        setError('Error loading GeoJSON: ' + err.message);
      });
    // Clean up
    return () => {
      if (dataLayer) dataLayer.setMap(null);
    };
  }, [setSelectedArea]);

  return (
    <div ref={drop} style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={mapRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', width: '100%', pointerEvents: 'auto' }} />
      {loading && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '4px', zIndex: 10 }}>
          Loading map and GeoJSON...
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,0,0,0.8)', color: '#fff', padding: '8px', borderRadius: '4px', zIndex: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default MapView;
