'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLocation, building } from "./components/location.jsx";
import { buildingPoints } from "./components/buildings";
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('./components/MapComponent'),
  { ssr: false }
);

const WeatherWidget = dynamic(
  () => import('./components/WeatherWidget'),
  { ssr: false }
);

export default function Home() {
  const [currentBuilding, setCurrentBuilding] = useState("Searching...");

  useEffect(() => {
    const updateLocation = () => {
        getLocation((result) => {
            setCurrentBuilding(result);
            console.log("Location update:", result);
        });
    };

    updateLocation();
    const intervalId = setInterval(updateLocation, 10000);
    return () => clearInterval(intervalId);
}, []);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #ddd'
      }}>
        <h1 style={{ margin: 0 }}>PNW Campus Map</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          <span style={{ 
            backgroundColor: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            Current Location: {currentBuilding}
          </span>
          <Link href="/events">Events Page</Link>
        </div>
      </div>
      <WeatherWidget />
      <MapComponent buildingPoints={buildingPoints} />
    </div>
  );
}