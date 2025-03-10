'use client';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

/* TODO: need to add an interactive layer
* Allows the user to add a marker to the map
* @param {Object} map - The map object
* @param {Array} coords - The coordinates of the marker
* @param {String} popupText - The text to display when the marker is clicked
*/
function addMarker(map, coords, popupText) {
  L.marker(coords)
    .bindPopup(popupText)
    .addTo(map);
}

export default function MapComponent({ buildingPoints }) {
  useEffect(() => {
    // Define the bounds (adjust these coordinates to your desired box)
    const southWest = L.latLng(41.57752532677525, -87.47749638635923); // Bottom left corner   
    const northEast = L.latLng(41.58841412396277, -87.47080018646325); // Top right corner
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
      doubleClickZoom: false,   // Disable double-click zoom
    });

    // Add click event handler to the map
    map.on('dblclick', function(e) {
      // Get clicked coordinates
      const coords = [e.latlng.lat, e.latlng.lng];
      
      // You can customize this to prompt the user for text
      const popupText = prompt('Enter description for this marker:');
      
      if (popupText) {
        // Use the existing addMarker function
        addMarker(map, coords, popupText);
      }
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


    return () => {
      map.remove();
    };
  }, [buildingPoints]);

  return <div id="map" style={{ height: '100vh', width: '100%' }}></div>;
}