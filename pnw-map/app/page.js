"use client";
import { useEffect, useState } from "react";
import { getLocation } from "./components/location.jsx";
import { buildingPoints } from "./components/buildings";
import dynamic from "next/dynamic";
import Navbar from "./components/Navbar";

const MapComponent = dynamic(() => import("./components/MapComponent"), {
  ssr: false,
});

const WeatherWidget = dynamic(() => import("./components/WeatherWidget"), {
  ssr: false,
});

const TrafficWidget = dynamic(() => import("./components/TrafficWidget"), {
  ssr: false,
});

export default function Home() {
  const [currentBuilding, setCurrentBuilding] = useState("Searching...");

  useEffect(() => {
    const updateLocation = () => {
      //update location every 10 seconds
      getLocation((buildingName) => {
        setCurrentBuilding(buildingName);
      });
    };

    updateLocation();
    const intervalId = setInterval(updateLocation, 10000);
    return () => clearInterval(intervalId);
  }, []);
  return (
    <>
      <Navbar currentBuilding={currentBuilding} />
      <div
        style={{
          position: "relative",
          height: "calc(100vh - 60px)", // Account for navbar height
          width: "100%",
          overflow: "hidden", // Prevent overflow
        }}
      >
        <WeatherWidget />
        <TrafficWidget />
        <MapComponent buildingPoints={buildingPoints} />
      </div>
    </>
  );
}
