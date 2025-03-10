'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = process.env.NEXT_PUBLIC_WEATHERAPI_KEY;
        const response = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Hammond,IN&aqi=no`
        );
        
        setWeather(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load weather data');
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 900000); // Update every 15 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="weather-widget">Loading...</div>;
  if (error) return <div className="weather-widget">{error}</div>;
  if (!weather) return null;

  return (
    <div className="weather-widget">
      <div className="weather-location">{weather.location.name}</div>
      <div className="weather-temp">
        {weather.current.temp_f}°F
        <img 
          src={weather.current.condition.icon} 
          alt={weather.current.condition.text}
          width="32"
          height="32"
        />
      </div>
      <div className="weather-condition">{weather.current.condition.text}</div>
      <style jsx>{`
        .weather-widget {
          position: absolute;
          top: 20px;
          right: 20px;
          background-color: rgba(255, 255, 255, 0.9);
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 1000;
          min-width: 150px;
          text-align: center;
        }
        .weather-location {
          font-weight: bold;
          margin-bottom: 4px;
        }
        .weather-temp {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 1.2em;
        }
        .weather-condition {
          font-size: 0.9em;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default WeatherWidget;