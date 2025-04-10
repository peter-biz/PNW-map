"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../components/AuthProvider";
import { supabase } from "../lib/supabase";

function calculateBuildingCenter(corners) {
  // Calculate center using all 4 corners
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
var violetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

async function addMarkerToDatabase(userId, coords, description, color) {
  const { data, error } = await supabase
    .from("markers")
    .insert([
      {
        user_id: userId,
        latitude: coords[0],
        longitude: coords[1],
        description: description,
        color: color,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteMarkerFromDatabase(markerId) {
  const { error } = await supabase.from("markers").delete().eq("id", markerId);

  if (error) throw error;
}

function addMarker(
  map,
  coords,
  popupText,
  color,
  markerId = null,
  markersRef = null
) {
  const markerOptions = {
    icon: color === "green" ? greenIcon : color === "red" ? redIcon : blueIcon,
  };

  const popupContent = document.createElement("div");
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
      data-marker-id="${markerId}"
    >
      Delete Marker
    </button>
  `;

  const marker = L.marker(coords, markerOptions)
    .bindPopup(popupContent)
    .addTo(map);

  marker.dbId = markerId;

  const deleteButton = popupContent.querySelector("button");
  deleteButton.addEventListener("click", async () => {
    if (confirm("Delete this marker?")) {
      try {
        if (marker.dbId) {
          await deleteMarkerFromDatabase(marker.dbId);
        }
        map.removeLayer(marker);
        if (markersRef?.current) {
          // Add null check
          const index = markersRef.current.indexOf(marker);
          if (index > -1) {
            markersRef.current.splice(index, 1);
          }
        }
      } catch (error) {
        console.error("Error deleting marker:", error);
        alert("Failed to delete marker");
      }
    }
  });

  return marker;
}

//TODO: fix some of the building points cuz the shapes are weird :)
function createBuildingPolygon(map, corners, buildingInfo) {
  // Ensure corners array exists and has 4 points
  if (!corners || corners.length !== 4) {
    console.warn("Invalid corners data for building:", buildingInfo.name);
    return;
  }

  try {
    const polygonCoords = corners.map((corner) => [corner.lat, corner.lng]);
    // Close the polygon by adding first point again
    polygonCoords.push(polygonCoords[0]);

    const polygon = L.polygon(polygonCoords, {
      color: "#3388ff",
      fillColor: "#3388ff",
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    polygon.on("click", () => {
      const content = document.createElement("div");
      content.className = "building-popup";
      content.innerHTML = `
        <h3 class="text-lg font-bold mb-2">${buildingInfo.name}</h3>
        <div class="floor-buttons">
          ${buildingInfo.floors
            .map(
              (floor) => `
            <button 
              class="floor-btn w-full mb-2 p-2 text-left hover:bg-gray-100 rounded"
              data-floor="${floor.level}"
            >
              ${floor.name}
            </button>
          `
            )
            .join("")}
        </div>
      `;

      const popup = L.popup({
        maxWidth: 300,
        className: "building-popup",
      })
        .setLatLng(polygon.getBounds().getCenter())
        .setContent(content);

      map.openPopup(popup);

      // Add click handlers for floor buttons
      content.querySelectorAll(".floor-btn").forEach((button) => {
        button.addEventListener("click", () => {
          const floorLevel = button.getAttribute("data-floor");
          const floor = buildingInfo.floors.find((f) => f.level === floorLevel);

          // Create floor plan overlay if a plan URL exists
          if (floor.planUrl) {
            const bounds = polygon.getBounds();
            const image = L.imageOverlay(floor.planUrl, bounds, {
              opacity: 0.8,
              zIndex: 1000,
            }).addTo(map);

            // Add close button
            const closeBtn = L.control({ position: "topright" });
            closeBtn.onAdd = function () {
              const div = L.DomUtil.create("div", "close-floor-plan");
              div.innerHTML = `
                <button class="bg-white p-2 rounded shadow">
                  ❌ Close Floor Plan
                </button>
              `;
              div.onclick = () => {
                map.removeLayer(image);
                map.removeControl(closeBtn);
              };
              return div;
            };
            closeBtn.addTo(map);
          } else {
            alert("Floor plan not available");
          }
        });
      });
    });

    // Add center marker for the building TODO:
    // const center = polygon.getBounds().getCenter();
    // L.marker([center.lat, center.lng])
    //   .bindPopup(buildingInfo.name)
    //   .addTo(map);

    return polygon;
  } catch (error) {
    console.error(
      "Error creating polygon for building:",
      buildingInfo.name,
      error
    );
  }
}

export default function MapComponent({ buildingPoints }) {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const locationMarkerRef = useRef(null);
  const markersRef = useRef([]);
  const classMarkersRef = useRef([]);
  const [userLocation, setUserLocation] = useState(null);

  // Load user markers from database
  const loadUserMarkers = async () => {
    if (!mapRef.current || !user) return;
    try {
      const { data: markers, error } = await supabase
        .from("markers")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      // Clear existing markers first
      markersRef.current.forEach((marker) => {
        marker.remove();
      });
      markersRef.current = [];
      // Add new markers
      markers?.forEach((marker) => {
        const newMarker = addMarker(
          mapRef.current,
          [marker.latitude, marker.longitude],
          marker.description,
          marker.color,
          marker.id,
          markersRef
        );
        markersRef.current.push(newMarker);
      });
    } catch (error) {
      console.error("Error loading markers:", error);
    }
  };

  /// Load class markers from database
  const loadClassMarkers = async () => {
    if (!mapRef.current || !user) return;

    try {
      // Clear existing class markers first
      classMarkersRef.current.forEach((marker) => {
        mapRef.current.removeLayer(marker);
      });
      classMarkersRef.current = [];

      // Fetch user's class schedule
      const { data: classSchedule, error } = await supabase
        .from("class_schedule")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // Create an object to store classes by building
      const classesByBuilding = {};

      // Group classes by building
      classSchedule?.forEach((classItem) => {
        if (!classesByBuilding[classItem.building]) {
          classesByBuilding[classItem.building] = [];
        }
        classesByBuilding[classItem.building].push(classItem);
      });

      // Create a marker for each building with classes
      Object.keys(classesByBuilding).forEach((buildingName) => {
        // Find the building in buildingPoints
        const building = buildingPoints && buildingPoints[buildingName];

        if (building && building.length === 4) {
          // Calculate building center
          const center = calculateBuildingCenter(
            building.map((point) => [point.lat, point.lng])
          );

          // Create list of classes for the popup
          const classes = classesByBuilding[buildingName];
          const classListHTML = classes
            .map(
              (c) => `
            <div class="class-item p-2 border-b">
              <div class="font-medium">${c.class_name}</div>
              <div class="text-sm">${buildingName} ${c.room}</div>
              <div class="text-sm">${c.days} ${c.start_time}-${c.end_time}</div>
            </div>
          `
            )
            .join("");

          // Create popup content
          const popupContent = document.createElement("div");
          popupContent.innerHTML = `
          <div class="schedule-popup">
            <h3 class="text-lg font-bold mb-2">Your Classes in ${buildingName}</h3>
            <div class="class-list">
              ${classListHTML}
            </div>
          </div>
        `;

          // Add marker with violet icon and save reference
          const marker = L.marker(center, {
            icon: violetIcon,
          })
            .bindPopup(popupContent)
            .addTo(mapRef.current);

          // Store marker reference for future cleanup
          classMarkersRef.current.push(marker);
        }
      });
    } catch (error) {
      console.error("Error loading class markers:", error);
    }
  };

  // Load user and class markers when user changes or map is initialized
  useEffect(() => {
    if (mapRef.current && user) {
      loadUserMarkers();
      loadClassMarkers();
    }
  }, [user]);

  // Initialize map only once
  useEffect(() => {
    const southWest = L.latLng(41.57752532677525, -87.47749638635923);
    const northEast = L.latLng(41.58841412396277, -87.47080018646325);
    const bounds = L.latLngBounds(southWest, northEast);

    // Only create map if it doesn't exist
    if (!mapRef.current) {
      const map = L.map("map", {
        center: [41.58297, -87.47416],
        zoomControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        minZoom: 17,
        maxZoom: 19,
        dragging: true,
        bounceAtZoomLimits: true,
        doubleClickZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        minZoom: 16,
        bounds: bounds,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      map.fitBounds(bounds);
      mapRef.current = map;

      if (user) {
        loadUserMarkers();
        loadClassMarkers();
      }

      // Add building markers if buildingPoints exist
      if (buildingPoints) {
        const buildingMarkers = [
          {
            name: "SULB",
            corners: buildingPoints.SULB,
            info: {
              name: "Student Union Library Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "GYTE",
            corners: buildingPoints.GYTE,
            info: {
              name: "Gyte Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "POTTER",
            corners: buildingPoints.POTTER,
            info: {
              name: "Potter Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "POWERS",
            corners: buildingPoints.POWERS,
            info: {
              name: "Powers Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "CLO",
            corners: buildingPoints.CLO,
            info: {
              name: "CLO Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "ANDERSON",
            corners: buildingPoints.ANDERSON,
            info: {
              name: "Anderson Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "NILS",
            corners: buildingPoints.NILS,
            info: {
              name: "Nils Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "PORTER",
            corners: buildingPoints.PORTER,
            info: {
              name: "Porter Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "OFFICE",
            corners: buildingPoints.OFFICE,
            info: {
              name: "Office Building",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "FITNESS",
            corners: buildingPoints.FITNESS,
            info: {
              name: "Fitness Center",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
          {
            name: "COUNSELING",
            corners: buildingPoints.COUNSELING,
            info: {
              name: "Counseling Center",
              floors: [
                { level: "1", name: "First Floor" },
                { level: "2", name: "Second Floor" },
              ],
            },
          },
        ];

        buildingMarkers.forEach((building) => {
          // Verify corners exist before creating polygon
          if (building.corners && building.corners.length === 4) {
            createBuildingPolygon(map, building.corners, building.info);
          } else {
            console.warn(`Invalid corners data for building: ${building.name}`);
          }
        });
      }

      // Add double-click marker functionality
      map.on("dblclick", function (e) {
        if (!user) {
          alert("Please sign in to add markers");
          return;
        }

        const coords = [e.latlng.lat, e.latlng.lng];

        const form = document.createElement("form");
        form.innerHTML = `
          <label for="desc">Description:</label>
          <input type="text" id="desc" name="desc" required>
          <label for="color">Color:</label>
          <select id="color" name="color">
            <option value="blue">Default</option>
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

        form.addEventListener("submit", async function (event) {
          event.preventDefault();
          const popupText = form.desc.value;
          const color = form.color.value;

          try {
            const markerData = await addMarkerToDatabase(
              user.id,
              coords,
              popupText,
              color
            );

            const marker = addMarker(
              map,
              coords,
              popupText,
              color,
              markerData.id,
              markersRef
            );
            markersRef.current.push(marker);
          } catch (error) {
            console.error("Error saving marker:", error);
            alert("Failed to save marker");
          }

          document.body.removeChild(form);
          document.removeEventListener("click", closeForm);
        });
      });

      // Clear markers control
      const clearControl = L.Control.extend({
        options: { position: "topleft" },
        onAdd: function () {
          const container = L.DomUtil.create(
            "div",
            "leaflet-bar leaflet-control"
          );
          const button = L.DomUtil.create("a", "", container);
          button.innerHTML = "🗑️";
          button.title = "Clear all markers";
          button.style.fontSize = "20px";
          button.style.textAlign = "center";
          button.style.cursor = "pointer";

          L.DomEvent.on(button, "click", async function () {
            if (!user) return;

            if (confirm("Clear all your markers?")) {
              try {
                await supabase.from("markers").delete().eq("user_id", user.id);

                markersRef.current.forEach((marker) => map.removeLayer(marker));
                markersRef.current = [];
              } catch (error) {
                console.error("Error clearing markers:", error);
                alert("Failed to clear markers");
              }
            }
          });

          return container;
        },
      });

      map.addControl(new clearControl());

      // Load markers after map is initialized
      loadUserMarkers();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [buildingPoints]); // Add buildingPoints as dependency

  // Handle location updates separately
  useEffect(() => {
    if (!mapRef.current) return;

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          // Update location marker
          if (locationMarkerRef.current) {
            mapRef.current.removeLayer(locationMarkerRef.current);
          }

          locationMarkerRef.current = L.marker([latitude, longitude], {
            icon: greenIcon,
          })
            .bindPopup("Your Location")
            .addTo(mapRef.current);
        },
        (error) => {
          console.error("Error getting location:", error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (locationMarkerRef.current) {
          mapRef.current?.removeLayer(locationMarkerRef.current);
        }
      };
    }
  }, []); // Empty dependency array - location watching starts only once

  return <div id="map" style={{ height: "100vh", width: "100%" }} />;
}
