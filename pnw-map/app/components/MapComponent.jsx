"use client";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRef } from "react";

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

  return [totalLat / corners.length, totalLng / corners.length];
}

//https://github.com/pointhi/leaflet-color-markers <-- for color markers
// Define custom icon for markers(leaflet doesnt have built in color options)
var greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
var blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
var redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* TODO: need to add an interactive layer
 * Allows the user to add a marker to the map
 * @param {Object} map - The map object
 * @param {Array} coords - The coordinates of the marker
 * @param {String} popupText - The text to display when the marker is clicked
 */
function addMarker(map, coords, popupText, color) {
  const markerOptions = {
    icon: color === "green"
      ? greenIcon
      : color === "blue"
      ? blueIcon
      : color === "red"
      ? redIcon
      : color === "blue",
  };

  // Create custom popup content with delete button
  const popupContent = document.createElement('div');
  popupContent.innerHTML = `
    <div style="margin-bottom: 5px;">${popupText}</div>
    <button 
      style="
        background-color: #ff4444;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        margin-top: 5px;
      "
    >
      Delete Marker
    </button>
  `;

  const marker = L.marker(coords, markerOptions)
    .bindPopup(popupContent)
    .addTo(map);

  // Add click handler to delete button
  const deleteButton = popupContent.querySelector('button');
  deleteButton.addEventListener('click', () => {
    if (confirm("Delete this marker?")) {
      map.removeLayer(marker);
      // Remove from markersRef if needed
      const index = markersRef.current.indexOf(marker);  //this throws an error because markersRef isnt defined yet
      if (index > -1) {
        markersRef.current.splice(index, 1);
      }
    }
  });

  return marker;
}

function currentLocation() {
  console.log("Getting current location...");
  if (navigator.geolocation) {
    console.log("Geolocation is supported by this browser.");
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      console.log(lat, lng);
    }
  );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

currentLocation();

export default function MapComponent({ buildingPoints }) {
  const markersRef = useRef([]); // Store markers in a ref

  useEffect(() => {
    // Define the bounds (adjust these coordinates to your desired box)
    const southWest = L.latLng(41.57752532677525, -87.47749638635923); // Bottom left corner
    const northEast = L.latLng(41.58841412396277, -87.47080018646325); // Top right corner
    const bounds = L.latLngBounds(southWest, northEast);

    // Initialize the map with restrictions
    const map = L.map("map", {
      zoomControl: false,
      maxBounds: bounds, // Restrict panning to these bounds
      maxBoundsViscosity: 1.0, // How hard the bounds resist dragging (0-1)
      minZoom: 17,
      maxZoom: 19,
      dragging: true,
      bounceAtZoomLimits: true,
      doubleClickZoom: false,
    });

    const clearAllMarkers = () => {
      markersRef.current.forEach((marker) => map.removeLayer(marker));
      markersRef.current = [];
    };

    // Add click event handler to the map
    map.on("dblclick", function (e) {
      // Get clicked coordinates
      const coords = [e.latlng.lat, e.latlng.lng];

      // Create a form element
      const form = document.createElement("form");
      form.innerHTML = `
    <label for="desc">Description:</label>
    <input type="text" id="desc" name="desc" required>
    <label for="color">Color:</label>
    <select id="color" name="color">
      <option value="default">Default</option>
      <option value="green">Green</option>
      <option value="red">Red</option>
      <option value="blue">Blue</option>
    </select>
    <button type="submit">Add Marker</button>
  `;
      form.style.position = "absolute";
      form.style.top = `${e.originalEvent.clientY}px`;
      form.style.left = `${e.originalEvent.clientX}px`;
      form.style.backgroundColor = "#FAF9F6";
      form.style.padding = "10px";
      form.style.border = "1px solid black";
      form.style.borderRadius = "4px";
      form.style.zIndex = "1000";

      // Add some basic styling for form elements
      const style = document.createElement("style");
      style.textContent = `
    .marker-form input, .marker-form select {
      margin: 5px 0;
      padding: 5px;
      width: 100%;
    }
    .marker-form button {
      margin-top: 10px;
      padding: 5px 10px;
      background-color: green;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `;
      form.classList.add("marker-form");
      document.head.appendChild(style);
      document.body.appendChild(form);

      // Add click handler to close form when clicking outside
      const closeForm = (e) => {
        if (!form.contains(e.target)) {
          document.body.removeChild(form);
          document.removeEventListener("click", closeForm);
        }
      };
      setTimeout(() => document.addEventListener("click", closeForm), 0);

      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const popupText = form.desc.value;
        const color = form.color.value;
        const marker = addMarker(map, coords, popupText, color);
        markersRef.current.push(marker);
        document.body.removeChild(form);
        document.removeEventListener("click", closeForm);
      });

      const clearControl = L.Control.extend({
        options: {
          position: 'topleft'
        },
        onAdd: function() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
          const button = L.DomUtil.create('a', '', container);
          button.innerHTML = '🗑️';  //TODO: fix, it places a new trashcan icon on each marker place so yeah
          button.title = 'Clear all markers';
          button.style.fontSize = '20px';
          button.style.textAlign = 'center';
          button.style.cursor = 'pointer';
          
          L.DomEvent.on(button, 'click', function() {
            if (confirm('Clear all custom markers?')) {
              clearAllMarkers();
            }
          });
          
          return container;
        }
      });

      map.addControl(new clearControl());
     

    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      minZoom: 17,
      bounds: bounds, // Restrict tile loading to bounds
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Fit the map to the bounds
    map.fitBounds(bounds);

    // Add markers for buildings
    const SULBcorners = [
      [buildingPoints.SULB[0].lat, buildingPoints.SULB[0].lng], //Top Left
      [buildingPoints.SULB[1].lat, buildingPoints.SULB[1].lng], //Top Right
      [buildingPoints.SULB[2].lat, buildingPoints.SULB[2].lng], //Bot Right
    ];
    const SULBcenter = calculateBuildingCenter(SULBcorners);
    L.marker(SULBcenter).bindPopup("SULB").addTo(map);

    const GYTEcorners = [
      [buildingPoints.GYTE[0].lat, buildingPoints.GYTE[0].lng], //Top Left
      [buildingPoints.GYTE[1].lat, buildingPoints.GYTE[1].lng], //Top Right
      [buildingPoints.GYTE[2].lat, buildingPoints.GYTE[2].lng], //Bot Right
    ];
    const GYTEcenter = calculateBuildingCenter(GYTEcorners);
    L.marker(GYTEcenter).bindPopup("GYTE").addTo(map);

    const POTTERcorners = [
      [buildingPoints.POTTER[0].lat, buildingPoints.POTTER[0].lng], //Top Left
      [buildingPoints.POTTER[1].lat, buildingPoints.POTTER[1].lng], //Top Right
      [buildingPoints.POTTER[2].lat, buildingPoints.POTTER[2].lng], //Bot Right
    ];
    const POTTERcenter = calculateBuildingCenter(POTTERcorners);
    L.marker(POTTERcenter).bindPopup("POTTER").addTo(map);

    //test location icon - green
    addMarker(map, [41.584527, -87.474722], "Test Location", "green");

    return () => {
      clearAllMarkers();
      map.remove();
    };
  }, [buildingPoints]);

  return <div id="map" style={{ height: "100vh", width: "100%" }}></div>;
}
