"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

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
        setError("Failed to load weather data");
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
    <div className={`weather-widget ${collapsed ? "collapsed" : ""}`}>
      <button
        className="slide-button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Show weather" : "Hide weather"}
      >
        {collapsed ? "◀" : "▶"}
      </button>

      <div className="widget-content">
        <div className="widget-header">
          <div className="widget-title">Weather</div>
        </div>
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
        <div className="weather-condition">
          {weather.current.condition.text}
        </div>
      </div>

      <style jsx>{`
        .weather-widget {
          position: fixed;
          top: 65px;
          right: 0;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 8px 0 0 8px;
          box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          text-align: center;
          display: flex;
          transform: translateX(0);
          transition: transform 0.3s ease;
          max-width: 300px;
          width: auto;
        }

        .weather-widget.collapsed {
          transform: translateX(calc(100% - 20px));
        }

        .slide-button {
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          font-size: 14px;
          padding: 8px 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
        }

        .widget-content {
          padding: 12px;
          min-width: 150px;
        }

        .widget-header {
          margin-bottom: 8px;
        }

        .widget-title {
          font-weight: bold;
        }

        .weather-location {
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

        @media (max-width: 640px) {
          .widget-content {
            min-width: 120px;
          }

          .weather-widget,
          .traffic-widget {
            max-width: 80%; /* Make sure widgets don't take up too much space on mobile */
          }
        }

        @media (max-width: 480px) {
          .widget-content {
            min-width: 100px;
            padding: 8px;
          }

          .slide-button {
            padding: 6px 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default WeatherWidget;
