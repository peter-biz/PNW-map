'use client';
import { useEffect, useState } from 'react';
import { getLocation, building } from "./components/location.jsx";
import { buildingPoints } from "./components/buildings";
import dynamic from 'next/dynamic';

// Dynamically import the Map component with ssr: false
const MapComponent = dynamic(
  () => import('./components/MapComponent'),
  { ssr: false } // This ensures the component only loads on the client side
);

export default function Home() {
  return (
    <div>
      <h1>PNW Campus Map</h1>
      <MapComponent buildingPoints={buildingPoints} />
    </div>
  );
}