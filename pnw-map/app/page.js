'use client';
import { useEffect, useState } from 'react';
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
  return (
    <div style={{ position: 'relative' }}>
      <h1>PNW Campus Map</h1>
      <WeatherWidget />
      <MapComponent buildingPoints={buildingPoints} />
    </div>
  );
}