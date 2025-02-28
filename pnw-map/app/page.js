//   const handleClick = () => {
//     getLocation((updatedBuilding) => {
//       alert(`Building: ${updatedBuilding}`);
//     });
//   };

//   function currLocation() {
//     console.log("Getting current location");
//     getLocation(displayLocation);

//     //update every 5 seconds
//     setInterval(function () {
//       getLocation(displayLocation);
//     }, 5000);
//   }

//   function displayLocation(updatedBuilding) {
//     console.log(updatedBuilding);
//     const location = document.getElementById("location");
//     location.innerHTML = updatedBuilding;
    
//     // Clear any existing error messages
//     const existingError = document.getElementById("location-error");
//     if (existingError) existingError.remove();
    
//     // Show error message if location access failed
//     if (updatedBuilding.includes("error") || updatedBuilding.includes("denied")) {
//         const errorDiv = document.createElement("div");
//         errorDiv.id = "location-error";
//         errorDiv.style.color = "red";
//         errorDiv.innerHTML = updatedBuilding;
//         location.appendChild(errorDiv);
//     }
// }

/*
      <button onClick={handleClick}>Get Location</button>
      <p id="location"></p>
      <button onClick={currLocation}>Get Current Location</button>
*/

  /* Scale of the map
  * Every drawn inch on the map is 1 foot in real life
  * which would be 1:12
  */


'use client';
import { useEffect } from 'react';
import { getLocation, building } from "./components/location.jsx";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildingPoints } from "./components/buildings";

export default function Home() {
  function calculateBuildingCenter(corners) {
    // Ensure we have exactly 3 corners
    if (corners.length !== 3) {
      throw new Error("Exactly three corner coordinates are required");
    }
  
    // Method 1: Calculate the centroid (geometric center) of the triangle
    const centroid = calculateCentroid(corners);
  
    return centroid;
  }

  function calculateCentroid(corners) {
    const totalLat = corners.reduce((sum, corner) => sum + corner[0], 0);
    const totalLng = corners.reduce((sum, corner) => sum + corner[1], 0);
    
    return [
      totalLat / corners.length,
      totalLng / corners.length
    ];
  }

  /*
  * Allows the user to add a marker to the map
  * @param {Object} map - The map object
  * @param {Array} coords - The coordinates of the marker
  * @param {String} popupText - The text to display when the marker is clicked
  */
  function addMarker(map, coords, popupText) {
    L.marker(coords)
      .bindPopup(popupText)
      .addTo
  }

  
  useEffect(() => {
    // Define the bounds (adjust these coordinates to your desired box)   //TODO: fix coords
    const southWest = L.latLng(41.579, -87.476); // Bottom left corner
    const northEast = L.latLng(41.588, -87.472); // Top right corner
    const bounds = L.latLngBounds(southWest, northEast);

    // Initialize the map with restrictions
    const map = L.map('map', {
      zoomControl: false,
      maxBounds: bounds,         // Restrict panning to these bounds
      maxBoundsViscosity: 1.0,   // How hard the bounds resist dragging (0-1)
      minZoom: 17,              // Minimum zoom level
      maxZoom: 19,              // Maximum zoom level
      dragging: true,           // Allow dragging within bounds
      bounceAtZoomLimits: true, // Bounce back when trying to zoom beyond limits
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 17,
      bounds: bounds,           // Restrict tile loading to bounds
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

 // Fit the map to the bounds
 map.fitBounds(bounds);


    // Add a marker for the user's location
    //TODO:


    // Add markers for buildings
    const SULBcorners = [
      [buildingPoints.SULB[0].lat, buildingPoints.SULB[0].lng], //Top Left
      [buildingPoints.SULB[1].lat, buildingPoints.SULB[1].lng], //Top Right
      [buildingPoints.SULB[2].lat, buildingPoints.SULB[2].lng]  //Bot Right
    ];
    const SULBcenter = calculateBuildingCenter(SULBcorners);
    L.marker(SULBcenter)
      .bindPopup("SULB")
      .addTo(map);

    const GYTEcorners = [
      [buildingPoints.GYTE[0].lat, buildingPoints.GYTE[0].lng], //Top Left
      [buildingPoints.GYTE[1].lat, buildingPoints.GYTE[1].lng], //Top Right
      [buildingPoints.GYTE[2].lat, buildingPoints.GYTE[2].lng]  //Bot Right
    ];
    const GYTEcenter = calculateBuildingCenter(GYTEcorners);
    L.marker(GYTEcenter)
      .bindPopup("GYTE")
      .addTo(map); 

    const POTTERcorners = [
      [buildingPoints.POTTER[0].lat, buildingPoints.POTTER[0].lng], //Top Left
      [buildingPoints.POTTER[1].lat, buildingPoints.POTTER[1].lng], //Top Right
      [buildingPoints.POTTER[2].lat, buildingPoints.POTTER[2].lng]  //Bot Right
    ];
    const POTTERcenter = calculateBuildingCenter(POTTERcorners);
    L.marker(POTTERcenter)
      .bindPopup("POTTER")
      .addTo(map);

  }, []);

  return (
    <div>
      <h1>PNW Campus Map</h1>
      <div id="map" style={{ height: '800px', width: '100%' }}></div>
    </div>
  );
}