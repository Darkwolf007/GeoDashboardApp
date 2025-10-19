
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);



const ForecastChart = ({ forecast, futureForecast, predictForecast }) => {
  if ((!forecast || forecast.length === 0) && (!futureForecast || futureForecast.length === 0) && (!predictForecast || predictForecast.length === 0)) {
    return <div style={{ height: '250px', width: '100%' }}>No forecast data</div>;
  }
  // Merge all years for x-axis
  const allYearsSet = new Set([
    ...(forecast ? forecast.map(f => f.year) : []),
    ...(futureForecast ? futureForecast.map(f => f.year) : []),
    ...(predictForecast ? predictForecast.map(f => f.year) : [])
  ]);
  const allYears = Array.from(allYearsSet).sort();

  // Helper to align data to allYears
  const alignData = (arr) => {
    if (!arr) return allYears.map(() => null);
    const dict = Object.fromEntries(arr.map(f => [f.year, f.price]));
    return allYears.map(y => dict[y] !== undefined ? dict[y] : null);
  };

  const alignedForecast = alignData(forecast);
  const alignedFuture = alignData(futureForecast);
  const alignedPredict = alignData(predictForecast);

  const data = {
    labels: allYears,
    datasets: [
      (forecast && forecast.length > 0) ? {
        label: 'Actual Price',
        data: alignedForecast,
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.1)',
        fill: false,
        tension: 0.3,
      } : null,
      (futureForecast && futureForecast.length > 0) ? {
        label: 'Forecast',
        data: alignedFuture,
        borderColor: 'orange',
        borderDash: [8, 4],
        backgroundColor: 'rgba(255, 123, 0, 0.1)',
        fill: false,
        tension: 0.3,
        pointStyle: 'rectRot',
      } : null,
      (predictForecast && predictForecast.length > 0) ? {
        label: 'Predict Price',
        data: alignedPredict,
        borderColor: 'green',
        backgroundColor: 'rgba(0,128,0,0.1)',
        fill: false,
        tension: 0.3,
      } : null
    ].filter(Boolean),
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      x: { title: { display: true, text: '' } },
      y: { title: { display: true, text: '' } },
    },
  };
  return (
    <div style={{ height: '250px', width: '100%' }}>
      <Line data={data} options={options} />
      {/* Debug: Show predictForecast data removed */}
      {/* Debug: Show final chart data */}
    </div>
  );
};

export default ForecastChart;
