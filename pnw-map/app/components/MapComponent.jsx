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

async function getFloorPlan(buildingName, floorLevel) {
  try {
    // Extract building ID from the full name, or use the name as-is
    const buildingId = buildingName.split(" ")[0]; // Get just the first part (e.g., "SULB")

    // Use consistent naming pattern for floor plans
    const floorPlanPath = `${buildingId}F${floorLevel}.png`; // Format like "SULBF1.png"
    //console.log("Attempting to load floor plan:", floorPlanPath);

    const { data, error } = await supabase.storage
      .from("floor-plans")
      .download(floorPlanPath);

    if (error) {
      console.error("Error downloading floor plan:", error);
      throw error;
    }

    return URL.createObjectURL(data);
  } catch (error) {
    console.error("Error loading floor plan:", error);
    return null;
  }
}

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

      // Check if building has floor plans
      if (!buildingInfo.hasFloorPlans || buildingInfo.floors.length === 0) {
        content.innerHTML = `
          <h3 class="text-lg font-bold mb-2">${buildingInfo.name}</h3>
          <p>No floor plans available for this building.</p>
        `;
      } else {
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
      }

      const popup = L.popup({
        maxWidth: 300,
        className: "building-popup",
      })
        .setLatLng(polygon.getBounds().getCenter())
        .setContent(content);

      map.openPopup(popup);

      // Only add click handlers if there are floor buttons
      // if (buildingInfo.hasFloorPlans && buildingInfo.floors.length > 0) { //TODO: //FIXME:
      content.querySelectorAll(".floor-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const floorLevel = button.getAttribute("data-floor");
          const floor = buildingInfo.floors.find((f) => f.level === floorLevel);

          try {
            // Function to load and display a specific floor
            const loadFloorPlan = async (floorToLoad) => {
              let floorPlanUrl;

              try {
                // Get floor plan using the general function
                floorPlanUrl = await getFloorPlan(
                  buildingInfo.name,
                  floorToLoad.level
                );

                if (!floorPlanUrl) {
                  console.error("Floor plan URL is null or undefined");
                }

                // Update title
                title.textContent = `${buildingInfo.name} - ${floorToLoad.name}`;

                // Update image
                image.src = floorPlanUrl;

                // Update current floor reference
                currentFloorIndex = buildingInfo.floors.findIndex(
                  (f) => f.level === floorToLoad.level
                );

                // Update navigation buttons
                updateNavigationButtons();
              } catch (error) {
                console.error("Error loading floor plan:", error);
                throw error;
              }
            };

            // Function to update the state of navigation buttons
            const updateNavigationButtons = () => {
              prevButton.disabled = currentFloorIndex <= 0;
              prevButton.style.opacity = currentFloorIndex <= 0 ? "0.5" : "1";

              nextButton.disabled =
                currentFloorIndex >= buildingInfo.floors.length - 1;
              nextButton.style.opacity =
                currentFloorIndex >= buildingInfo.floors.length - 1
                  ? "0.5"
                  : "1";
            };

            // Close the building popup first
            map.closePopup();

            // Set initial floor index
            let currentFloorIndex = buildingInfo.floors.findIndex(
              (f) => f.level === floorLevel
            );

            // Create a modal overlay for the floor plan
            const modal = document.createElement("div");
            modal.className = "floor-plan-modal";
            modal.style.position = "fixed";
            modal.style.top = "0";
            modal.style.left = "0";
            modal.style.width = "100%";
            modal.style.height = "100%";
            modal.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            modal.style.zIndex = "2000";
            modal.style.display = "flex";
            modal.style.justifyContent = "center";
            modal.style.alignItems = "center";

            // Create the content container
            const modalContent = document.createElement("div");
            modalContent.className = "floor-plan-modal-content";
            modalContent.style.backgroundColor = "white";
            modalContent.style.padding = "20px";
            modalContent.style.borderRadius = "8px";
            modalContent.style.maxWidth = "90%";
            modalContent.style.maxHeight = "90%";
            modalContent.style.position = "relative";
            modalContent.style.overflow = "hidden";
            modalContent.style.display = "flex";
            modalContent.style.flexDirection = "column";

            // Header with title and close button
            const header = document.createElement("div");
            header.style.display = "flex";
            header.style.justifyContent = "space-between";
            header.style.alignItems = "center";
            header.style.marginBottom = "15px";

            const title = document.createElement("h3");
            title.textContent = `${buildingInfo.name} - ${floor.name}`;
            title.style.margin = "0";
            title.style.fontSize = "18px";

            const closeButton = document.createElement("button");
            closeButton.textContent = "✖";
            closeButton.style.background = "none";
            closeButton.style.border = "none";
            closeButton.style.fontSize = "20px";
            closeButton.style.cursor = "pointer";
            closeButton.style.padding = "5px";

            header.appendChild(title);
            header.appendChild(closeButton);

            // Image container with zoom and pan functionality
            const imageContainer = document.createElement("div");
            imageContainer.className = "floor-plan-image-container";
            imageContainer.style.flex = "1";
            imageContainer.style.overflow = "hidden";
            imageContainer.style.position = "relative";
            imageContainer.style.textAlign = "center";
            imageContainer.style.touchAction = "none"; // Prevent browser's default touch actions

            // Create a wrapper for zoom and pan
            const imageWrapper = document.createElement("div");
            imageWrapper.className = "floor-plan-image-wrapper";
            imageWrapper.style.transformOrigin = "0 0";
            imageWrapper.style.transition = "transform 0.1s ease-out";
            imageWrapper.style.cursor = "grab";

            const image = document.createElement("img");
            image.alt = `${buildingInfo.name} ${floor.name} floor plan`;
            image.style.maxWidth = "100%";
            image.style.maxHeight = "70vh";
            image.style.objectFit = "contain";
            image.draggable = false; // Prevent browser default drag

            // Add the image to the wrapper, and the wrapper to the container
            imageWrapper.appendChild(image);
            imageContainer.appendChild(imageWrapper);

            // Add zoom controls
            const zoomControls = document.createElement("div");
            zoomControls.style.position = "absolute";
            zoomControls.style.bottom = "10px";
            zoomControls.style.right = "10px";
            zoomControls.style.display = "flex";
            zoomControls.style.gap = "5px";

            const zoomInBtn = document.createElement("button");
            zoomInBtn.textContent = "+";
            zoomInBtn.style.width = "40px";
            zoomInBtn.style.height = "40px";
            zoomInBtn.style.borderRadius = "50%";
            zoomInBtn.style.backgroundColor = "white";
            zoomInBtn.style.border = "1px solid #ccc";
            zoomInBtn.style.fontSize = "20px";
            zoomInBtn.style.cursor = "pointer";
            zoomInBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";

            const zoomOutBtn = document.createElement("button");
            zoomOutBtn.textContent = "−";
            zoomOutBtn.style.width = "40px";
            zoomOutBtn.style.height = "40px";
            zoomOutBtn.style.borderRadius = "50%";
            zoomOutBtn.style.backgroundColor = "white";
            zoomOutBtn.style.border = "1px solid #ccc";
            zoomOutBtn.style.fontSize = "20px";
            zoomOutBtn.style.cursor = "pointer";
            zoomOutBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";

            zoomControls.appendChild(zoomOutBtn);
            zoomControls.appendChild(zoomInBtn);
            imageContainer.appendChild(zoomControls);

            // State variables for zoom and pan
            let scale = 1;
            let translateX = 0;
            let translateY = 0;
            let startX = 0;
            let startY = 0;
            let isDragging = false;

            // Function to update the transform
            const updateTransform = () => {
              imageWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            };

            // Zoom in function
            const zoomIn = () => {
              if (scale < 3) {
                scale *= 1.2;
                updateTransform();
              }
            };

            // Zoom out function
            const zoomOut = () => {
              if (scale > 0.5) {
                scale /= 1.2;
                // If zooming out below 1, reset position
                if (scale < 1) {
                  translateX = 0;
                  translateY = 0;
                }
                updateTransform();
              }
            };

            // Add click handlers for zoom buttons
            zoomInBtn.addEventListener("click", zoomIn);
            zoomOutBtn.addEventListener("click", zoomOut);

            // Mouse and touch events for dragging
            imageWrapper.addEventListener("mousedown", (e) => {
              if (scale > 1) {
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
                imageWrapper.style.cursor = "grabbing";
                e.preventDefault();
              }
            });

            // Touch start event
            imageWrapper.addEventListener("touchstart", (e) => {
              if (scale > 1 && e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX - translateX;
                startY = e.touches[0].clientY - translateY;
                e.preventDefault();
              }
            });

            // Handle pinch to zoom (touch only)
            let initialDistance = 0;
            let initialScale = 1;

            imageWrapper.addEventListener("touchstart", (e) => {
              if (e.touches.length === 2) {
                // Get the distance between two fingers
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialDistance = Math.sqrt(dx * dx + dy * dy);
                initialScale = scale;
                e.preventDefault();
              }
            });

            imageWrapper.addEventListener("touchmove", (e) => {
              if (e.touches.length === 2) {
                // Calculate new distance
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Calculate new scale
                scale = initialScale * (distance / initialDistance);
                scale = Math.min(Math.max(scale, 0.5), 3); // Limit scale
                
                updateTransform();
                e.preventDefault();
              } else if (isDragging && e.touches.length === 1) {
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                updateTransform();
                e.preventDefault();
              }
            });

            // Mouse move and mouse up events
            document.addEventListener("mousemove", (e) => {
              if (isDragging) {
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                updateTransform();
                e.preventDefault();
              }
            });

            document.addEventListener("mouseup", () => {
              isDragging = false;
              imageWrapper.style.cursor = "grab";
            });

            // Touch end event
            document.addEventListener("touchend", () => {
              isDragging = false;
              initialDistance = 0;
            });

            // Double tap to zoom in (mobile)
            let lastTap = 0;
            imageWrapper.addEventListener("touchend", (e) => {
              const now = new Date().getTime();
              const timeSince = now - lastTap;
              if (timeSince < 300 && timeSince > 0) {
                // Double tap detected
                if (scale > 1) {
                  // If already zoomed in, reset
                  scale = 1;
                  translateX = 0;
                  translateY = 0;
                } else {
                  // Zoom in
                  scale = 2;
                }
                updateTransform();
                e.preventDefault();
              }
              lastTap = now;
            });

            // Load event for image
            image.addEventListener("load", () => {
              // Reset transformation when a new image loads
              scale = 1;
              translateX = 0;
              translateY = 0;
              updateTransform();
            });

            // Handle wheel event for desktop zoom
            imageContainer.addEventListener("wheel", (e) => {
              e.preventDefault();
              const delta = Math.sign(e.deltaY);
              if (delta > 0) {
                zoomOut();
              } else {
                zoomIn();
              }
            });

            // Navigation buttons container
            const navContainer = document.createElement("div");
            navContainer.style.display = "flex";
            navContainer.style.justifyContent = "space-between";
            navContainer.style.marginTop = "15px";

            // Previous floor button
            const prevButton = document.createElement("button");
            prevButton.textContent = "← Previous Floor";
            prevButton.style.padding = "8px 16px";
            prevButton.style.backgroundColor = "#3388ff";
            prevButton.style.color = "white";
            prevButton.style.border = "none";
            prevButton.style.borderRadius = "4px";
            prevButton.style.cursor = "pointer";

            // Floor indicator
            const floorIndicator = document.createElement("div");
            floorIndicator.style.padding = "8px";
            floorIndicator.style.display = "flex";
            floorIndicator.style.alignItems = "center";

            // Next floor button
            const nextButton = document.createElement("button");
            nextButton.textContent = "Next Floor →";
            nextButton.style.padding = "8px 16px";
            nextButton.style.backgroundColor = "#3388ff";
            nextButton.style.color = "white";
            nextButton.style.border = "none";
            nextButton.style.borderRadius = "4px";
            nextButton.style.cursor = "pointer";

            navContainer.appendChild(prevButton);
            navContainer.appendChild(floorIndicator);
            navContainer.appendChild(nextButton);

            // Assemble the modal
            modalContent.appendChild(header);
            modalContent.appendChild(imageContainer);
            modalContent.appendChild(navContainer);
            modal.appendChild(modalContent);

            // Add to document
            document.body.appendChild(modal);

            // Load initial floor plan
            await loadFloorPlan(floor);

            // Button event handlers
            closeButton.addEventListener("click", () => {
              document.body.removeChild(modal);
              // Clean up event listeners when modal is closed
              document.removeEventListener("mousemove", null);
              document.removeEventListener("mouseup", null);
              document.removeEventListener("touchmove", null);
              document.removeEventListener("touchend", null);
            });

            prevButton.addEventListener("click", async () => {
              if (currentFloorIndex > 0) {
                try {
                  await loadFloorPlan(
                    buildingInfo.floors[currentFloorIndex - 1]
                  );
                } catch (error) {
                  console.error("Error loading previous floor:", error);
                  alert("Could not load previous floor plan");
                }
              }
            });

            nextButton.addEventListener("click", async () => {
              if (currentFloorIndex < buildingInfo.floors.length - 1) {
                try {
                  await loadFloorPlan(
                    buildingInfo.floors[currentFloorIndex + 1]
                  );
                } catch (error) {
                  console.error("Error loading next floor:", error);
                  alert("Could not load next floor plan");
                }
              }
            });

            // Close when clicking outside the content
            modal.addEventListener("click", (e) => {
              if (e.target === modal) {
                document.body.removeChild(modal);
                // Clean up event listeners when modal is closed
                document.removeEventListener("mousemove", null);
                document.removeEventListener("mouseup", null);
                document.removeEventListener("touchmove", null);
                document.removeEventListener("touchend", null);
              }
            });

            // Update navigation button states initially
            updateNavigationButtons();
          } catch (error) {
            console.error("Error displaying floor plan:", error);
            alert(
              "Error loading floor plan: " + (error.message || "Unknown error")
            );
          }
        });
      });
    });

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
  const [buildings, setBuildings] = useState({});
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    // Check if supabase client is properly initialized
    if (!supabase) {
      console.error("Supabase client is not initialized!");
    } else {
      console.log("Supabase client is ready");
      // Test with a simple query
      supabase
        .from("buildings")
        .select("count", { count: "exact" })
        .then(({ count, error }) => {
          if (error) {
            console.error("Test query failed:", error);
          } else {
            //console.log(`Database connection successful. Found ${count} buildings.`);
          }
        });
    }
  }, []);

  const fetchBuildingData = async () => {
    try {
     // console.log("Starting to fetch building data...");
      setDbLoaded(false);

      // Fetch buildings data
    // console.log("Fetching buildings...");
      const buildingsResult = await supabase.from("buildings").select("*");

      if (buildingsResult.error) {
        console.error("Error fetching buildings:", buildingsResult.error);
        throw buildingsResult.error;
      }

      const buildingsData = buildingsResult.data || [];
     // console.log(`Successfully fetched ${buildingsData.length} buildings`);

      const buildingsObj = {};
      buildingsData.forEach((building) => {
        buildingsObj[building.name] = building;
      });

     // console.log("Buildings object:", buildingsObj);

      // Set buildings state
      setBuildings(buildingsObj);
      setDbLoaded(true);
    } catch (error) {
      // Enhanced error logging
      //console.error("Error fetching building data:", error);

      // Fall back to hardcoded data if needed
      setBuildings({
        SULB: {
          name: "SULB",
          display_name: "Student Union & Library Building",
          floors: 3,
        },
        CLO: {
          name: "CLO",
          display_name: "Classroom Office Building",
          floors: 3,
        },
        PWRS: { name: "PWRS", display_name: "Powers Building", floors: 2 },
        ANDERSON: {
          name: "ANDERSON",
          display_name: "Anderson Building",
          floors: 2,
        },
        GYTE: { name: "GYTE", display_name: "Gyte Building", floors: 2 },
        PORTER: { name: "PORTER", display_name: "Porter Hall", floors: 2 },
        FITNESS: { name: "FITNESS", display_name: "Fitness Center", floors: 2 },
        COUNSELING: {
          name: "COUNSELING",
          display_name: "Riley Counseling Center",
          floors: 0,
        },
      });
    } finally {
     // console.log("Fetch operation completed");
      setDbLoaded(true);
    }
  };

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

  // Fetch building data from API
  useEffect(() => {
    fetchBuildingData();
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!dbLoaded || mapRef.current) {
      return;
    }

    const southWest = L.latLng(41.57752532677525, -87.47749638635923);
    const northEast = L.latLng(41.58888074112958, -87.47139346964643);
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
        // Create building markers array
        const buildingMarkers = Object.keys(buildingPoints).map(
          (buildingId) => {
            const corners = buildingPoints[buildingId];

            // Look up building directly by name (case-insensitive)
            const buildingFromDb = Object.values(buildings).find(
              (building) =>
                building.name.toUpperCase() === buildingId.toUpperCase()
            );

            // Log for debugging
           // console.log(`Building ${buildingId} lookup:`, buildingFromDb);

            // Create floors array based on database or defaults
            let floors = [];

            if (buildingFromDb) {
              // Special handling for buildings with no floor plans
              if (buildingId === "COUNSELING" || buildingFromDb.floors === 0) {
                floors = [];
              //  console.log(`Building ${buildingId} has no floor plans`);
              } else {
                // Use number of floors from database
               // console.log(`Building ${buildingId} has ${buildingFromDb.floors} floors`);
                for (let i = 1; i <= buildingFromDb.floors; i++) {
                  floors.push({
                    level: i.toString(),
                    name:
                      i === 1
                        ? "First Floor"
                        : i === 2
                        ? "Second Floor"
                        : i === 3
                        ? "Third Floor"
                        : `Floor ${i}`,
                  });
                }
              }
            } else {
              // If building not in database
              console.log(
                `Building ${buildingId} not found in database, using default floors`
              );
              if (buildingId === "COUNSELING") {
                floors = [];
              } else {
                // Default to 3 floors as fallback
                floors = [
                  { level: "1", name: "First Floor" },
                  { level: "2", name: "Second Floor" },
                  { level: "3", name: "Third Floor" },
                ];
              }
            }

            return {
              name: buildingId,
              corners: corners,
              info: {
                name: buildingFromDb
                  ? buildingFromDb.display_name || buildingFromDb.name
                  : buildingId,
                description: buildingFromDb ? buildingFromDb.desc : "",
                type: buildingFromDb ? buildingFromDb.building_type : "",
                floors: floors,
                hasFloorPlans: !(
                  buildingId === "COUNSELING" ||
                  (buildingFromDb && buildingFromDb.floors === 0)
                ),
              },
            };
          }
        );

        // Create the building polygons
        buildingMarkers.forEach((building) => {
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
  }, [buildings, user, buildingPoints, dbLoaded]); // Add buildingPoints as dependency

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
          // Not setting error code becasue it looks ugly in the header
          console.log("Location unavailable");
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