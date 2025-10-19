// Main App component for Geodashboard
import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import HousingTypeDropdown from './components/HousingTypeDropdown';
import ForecastChart from './components/ForecastChart';
import axios from 'axios';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const BACKEND_URL = "https://geo-dashboard-app.vercel.app"; // Update if backend is hosted elsewhere

//const BACKEND_URL = 'http://localhost:8000/predict'; // Update if backend is hosted elsewhere




const App = () => {
	const [selectedArea, setSelectedArea] = useState(null);
	const [housingType, setHousingType] = useState('1 B/R');
	const [amenities, setAmenities] = useState({});
	const [forecast, setForecast] = useState([]);
	const [futureForecast, setFutureForecast] = useState([]);
	const [predictForecast, setPredictForecast] = useState([]);
	const [darkMode, setDarkMode] = useState(false);

	// Set amenities to the selected area's amenities count whenever selectedArea changes
	useEffect(() => {
		const amenityOrder = [
			'hospital', 'metro', 'school', 'university', 'park', 'office', 'poi', 'landfill', 'prison', 'highway', 'bar', 'cemetery'
		];
		if (selectedArea && typeof selectedArea === 'object') {
			const defaultAmenities = {};
			amenityOrder.forEach(key => {
				// Extract directly from selectedArea properties
				defaultAmenities[key] = selectedArea[key] !== undefined ? selectedArea[key] : 0;
			});
			setAmenities(defaultAmenities);
		} else {
			// If no area selected, set all to zero
			const defaultAmenities = {};
			amenityOrder.forEach(key => { defaultAmenities[key] = 0; });
			setAmenities(defaultAmenities);
		}
	}, [selectedArea]);


		useEffect(() => {
			// If selectedArea has ActualPrice, use it for chart
			if (selectedArea && selectedArea.ActualPrice && housingType) {
				const priceDict = selectedArea.ActualPrice[housingType];
				if (priceDict) {
					// Convert year-price pairs to array for chart
					const forecastArr = Object.entries(priceDict).map(([year, price]) => ({ year, price }));
					setForecast(forecastArr);
				} else {
					setForecast([]);
				}
			} else {
				setForecast([]);
			}

			// Debug: log PredictPrice and housingType
			let predictPriceObj = selectedArea?.PredictPrice;
			if (predictPriceObj && typeof predictPriceObj === 'string') {
				try {
					predictPriceObj = JSON.parse(predictPriceObj);
				} catch (err) {
					predictPriceObj = {};
				}
			}
			if (selectedArea) {
				// eslint-disable-next-line no-console
				console.log('selectedArea.PredictPrice:', predictPriceObj);
				// eslint-disable-next-line no-console
				console.log('housingType:', housingType);
			}

			// If selectedArea has PredictPrice, use it for chart
			if (predictPriceObj && housingType) {
				const predictDict = predictPriceObj[housingType];
				// eslint-disable-next-line no-console
				console.log('predictDict:', predictDict);
				if (predictDict) {
					const predictArr = Object.entries(predictDict).map(([year, price]) => ({ year, price }));
					// eslint-disable-next-line no-console
					console.log('predictArr:', predictArr);
					setPredictForecast(predictArr);
				} else {
					setPredictForecast([]);
				}
			} else {
				setPredictForecast([]);
			}
		}, [selectedArea, housingType]);

		// Fetch next 5 years forecast from backend
		useEffect(() => {
			if (selectedArea && housingType) {
				// Extract features for backend
				const zone_index = selectedArea.ZoneIndex || 0;
				const rooms_en = housingType;
				const years = selectedArea.ActualPrice && selectedArea.ActualPrice[housingType]
					? Object.keys(selectedArea.ActualPrice[housingType])
					: [];
				// Weighted score: sum of amenity counts
				const weighted_score = Object.values(amenities).reduce((a, b) => a + b, 0);
				   // Always send latest predicted price for 2025 in predict_price
				   let predictPriceObj = selectedArea?.PredictPrice;
				   if (predictPriceObj && typeof predictPriceObj === 'string') {
					   try {
						   predictPriceObj = JSON.parse(predictPriceObj);
					   } catch (err) {
						   predictPriceObj = {};
					   }
				   }
				   let predict_price = {};
				   if (predictPriceObj && predictPriceObj[housingType]) {
					   // Only send the latest year (e.g., 2025) for the selected housingType
					   const years = Object.keys(predictPriceObj[housingType]);
					   if (years.length > 0) {
						   const lastYear = years[years.length - 1];
						   predict_price[lastYear] = predictPriceObj[housingType][lastYear];
					   }
				   }
				   axios.post(`${BACKEND_URL}/predict`, {
					   zone_index,
					   area: selectedArea?.Area || '',
					   rooms_en,
					   amenities_counter: amenities,
					   actual_price: selectedArea?.ActualPrice || {},
					   predict_price
				   })
				.then(res => {
					// Backend returns [{year, price}, ...]
					setFutureForecast(res.data.forecast || []);
				})
				.catch(() => setFutureForecast([]));
			} else {
				setFutureForecast([]);
			}
		}, [selectedArea, housingType, amenities, forecast]);

					return (

						<DndProvider backend={HTML5Backend}>
							<div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: darkMode ? '#222' : '#fafafa', color: darkMode ? '#fafafa' : '#222' }}>
								<div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
									<div style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '16px', minWidth: 0 }}>
										<div style={{ flex: 2, minHeight: 0, marginBottom: '8px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
											<MapView selectedArea={selectedArea} setSelectedArea={setSelectedArea} amenities={amenities} setAmenities={setAmenities} />
										</div>
										<div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row', gap: 0 }}>
											   {/* Left: Chart */}
											   <div style={{ flex: 1, border: '3px solid orange', borderRadius: '8px 0 0 8px', padding: '8px', paddingTop: '20px', background: darkMode ? '#222' : '#fafafa', display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
												   <h4 style={{ marginBottom: '-20px', color: darkMode ? '#ffd700' : 'blue', textAlign: 'left', fontWeight: 'bold' }}>Graph</h4>
												   <ForecastChart forecast={forecast} futureForecast={futureForecast} predictForecast={predictForecast} />
											   </div>
											   {/* Center: Controls/Buttons */}
											   <div style={{ flex: 1, borderTop: '3px solid orange', borderBottom: '3px solid orange', borderRight: '1.5px solid orange', borderLeft: '1.5px solid orange', borderRadius: 0, padding: '16px 8px', paddingTop: '20px', background: darkMode ? '#222' : '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minWidth: 0 }}>
												   <h4 style={{ marginBottom: '110px', color: darkMode ? '#ffd700' : 'blue', textAlign: 'left', fontWeight: 'bold', width: '100%' }}>Controller</h4>
												   {/* Area name and zone index as plain text */}
												   <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
													   <span style={{ fontSize: 18, color: darkMode ? '#ffd700' : '#222', fontWeight: 'bold' }}>{selectedArea?.AreaName || ''}</span>
													   <span style={{ fontSize: 18, color: darkMode ? '#ffd700' : '#222', fontWeight: 'bold' }}>{selectedArea?.ZoneIndex !== undefined ? selectedArea.ZoneIndex : ''}</span>
												   </div>
												{/* Buttons side by side */}
												<div style={{ display: 'flex', flexDirection: 'row', gap: '12px', width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
													<button
														onClick={() => setDarkMode(dm => !dm)}
														style={{ height: '36px', minWidth: 36, padding: '0 16px', borderRadius: '6px', border: '1px solid #ccc', background: darkMode ? '#ffd700' : '#333', color: darkMode ? '#222' : '#ffd700', cursor: 'pointer', fontWeight: 'bold', fontSize: 18 }}
														title="Toggle Dark Mode"
													>
														{darkMode ? 'X' : 'O'}
													</button>
													<HousingTypeDropdown housingType={housingType} setHousingType={setHousingType} selectedArea={selectedArea} style={{ height: '36px', minWidth: 120, fontSize: 18, borderRadius: '6px', border: '1px solid #ccc', padding: '0 16px', background: darkMode ? '#333' : '#fafafa', color: darkMode ? '#ffd700' : '#222' }} />
													<button
														onClick={() => {
															setSelectedArea(null);
															setHousingType('1 B/R');
															setAmenities({});
															setForecast([]);
															setFutureForecast([]);
														}}
														style={{ height: '36px', minWidth: 36, padding: '0 0', borderRadius: '6px', border: '1px solid #ccc', background: darkMode ? '#333' : '#fafafa', color: darkMode ? '#ffd700' : '#222', cursor: 'pointer', fontWeight: 'bold', fontSize: 18 }}
														title="Reset all selections"
													>
														R
													</button>
													<button
														onClick={async () => {
															if (!selectedArea || !housingType) return;
															const zone_index = selectedArea?.ZoneIndex || 0;
															const area = selectedArea?.AreaName || '';
															const rooms_en = housingType;
															const amenities_counter = amenities;
															// Use predicted price for forecast
															let predictPriceObj = selectedArea?.PredictPrice;
															if (predictPriceObj && typeof predictPriceObj === 'string') {
																try {
																	predictPriceObj = JSON.parse(predictPriceObj);
																} catch (err) {
																	predictPriceObj = {};
																}
															}
															const predict_price = predictPriceObj && predictPriceObj[housingType] ? predictPriceObj[housingType] : {};
															try {
																const res = await axios.post(`${BACKEND_URL}/predict`{
																	zone_index,
																	area,
																	rooms_en,
																	amenities_counter,
																	predict_price
																});
																let forecastArr = res.data.forecast || [];
																// Always merge last predicted price for continuity
																const predictYears = Object.keys(predict_price);
																if (predictYears.length > 0) {
																	const lastYear = predictYears[predictYears.length - 1];
																	const lastPrice = predict_price[lastYear];
																	// Only add if not already present
																	if (!forecastArr.some(f => f.year === lastYear)) {
																		forecastArr = [{ year: lastYear, price: lastPrice }, ...forecastArr];
																	}
																}
																setFutureForecast(forecastArr);
															} catch (err) {
																setFutureForecast([]);
															}
														}}
														style={{ height: '36px', minWidth: 120, padding: '0 16px', borderRadius: '6px', border: '1px solid #ccc', background: darkMode ? '#333' : '#fafafa', color: darkMode ? '#222' : '#222', cursor: 'pointer', fontWeight: 'bold', fontSize: 18 }}
														title="Run Forecast"
													>
														Forecast
													</button>
												</div>
											</div>
											{/* Right: Amenities */}
											   <div style={{ flex: 1, border: '3px solid orange', borderRadius: '0 8px 8px 0', padding: '8px', paddingTop: '20px', background: darkMode ? '#333' : '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', minHeight: 0, minWidth: 0 }}>
												   <h4 style={{ marginBottom: '8px', color: darkMode ? '#ffd700' : 'blue', textAlign: 'left', fontWeight: 'bold' }}>Amenities</h4>
												<div style={{
													display: 'grid',
													gridTemplateColumns: 'repeat(6, 1fr)',
													gap: '8px',
													width: '100%',
													minWidth: 0
												}}>
													{(() => {
														const iconUrls = {
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
														const amenityOrder = [
															'hospital', 'metro', 'school', 'university', 'park', 'office', 'poi', 'landfill', 'prison', 'highway', 'bar', 'cemetery'
														];
														const values = selectedArea || {};
														return amenityOrder.map(key => {
															// Try all case variants for robustness
															const value =
																values[key] !== undefined ? values[key]
																: values[key.charAt(0).toUpperCase() + key.slice(1)] !== undefined ? values[key.charAt(0).toUpperCase() + key.slice(1)]
																: values[key.toLowerCase()] !== undefined ? values[key.toLowerCase()]
																: 0;
															const iconUrl = iconUrls[key] ? (darkMode ? iconUrls[key].dark : iconUrls[key].light) : null;
															// Handler for + and -
															const handleChange = (delta) => {
																setAmenities(prev => {
																	const newAmenities = { ...prev };
																	const current = newAmenities[key] || 0;
																	if (delta === 1) {
																		newAmenities[key] = current + 1;
																	} else if (delta === -1) {
																		newAmenities[key] = Math.max(0, current - 1);
																		if (newAmenities[key] === 0) delete newAmenities[key];
																	}
																	return newAmenities;
																});
															};
															return (
																<div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
																	{iconUrl ? <img src={iconUrl} alt={key} style={{ width: 32, height: 32, marginBottom: 4 }} /> : <span style={{ fontSize: '2em', marginBottom: 4 }}>?</span>}
																	<span style={{ color: darkMode ? '#ffd700' : '#222', fontSize: '1em', textAlign: 'center', wordBreak: 'break-word' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
																	<span style={{ color: darkMode ? '#ffd700' : '#222', fontSize: '1em', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '2px' }}>
																		<button onClick={() => handleChange(1)} style={{ width: 18, height: 18, fontWeight: 'bold', borderRadius: 3, border: '1px solid #ccc', background: darkMode ? '#333' : '#f4f4f4', color: darkMode ? '#ffd700' : '#222', cursor: 'pointer', padding: 0, marginRight: 2 }}>+</button>
																		{amenities[key] || 0}
																		<button onClick={() => handleChange(-1)} style={{ width: 18, height: 18, fontWeight: 'bold', borderRadius: 3, border: '1px solid #ccc', background: darkMode ? '#333' : '#f4f4f4', color: darkMode ? '#ffd700' : '#222', cursor: 'pointer', padding: 0, marginLeft: 2 }}>-</button>
																	</span>
																</div>
															);
														});
													})()}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</DndProvider>
					);
};

export default App;
