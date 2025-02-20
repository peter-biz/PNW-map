'use client';
import { getLocation, building } from "./components/location.jsx";

export default function Home() {
  const handleClick = () => {
    getLocation((updatedBuilding) => {
      alert(`Building: ${updatedBuilding}`);
    });
  };

  function currLocation() {
    console.log("Getting current location");
    getLocation(displayLocation);

    //update every 5 seconds
    setInterval(function () {
      getLocation(displayLocation);
    }, 5000);
  }

  function displayLocation(updatedBuilding) {
    console.log(updatedBuilding);
    const location = document.getElementById("location");
    location.innerHTML = updatedBuilding;
    
    // Clear any existing error messages
    const existingError = document.getElementById("location-error");
    if (existingError) existingError.remove();
    
    // Show error message if location access failed
    if (updatedBuilding.includes("error") || updatedBuilding.includes("denied")) {
        const errorDiv = document.createElement("div");
        errorDiv.id = "location-error";
        errorDiv.style.color = "red";
        errorDiv.innerHTML = updatedBuilding;
        location.appendChild(errorDiv);
    }
}

  return (
    <div>
      <h1>map</h1>

      <button onClick={handleClick}>Get Location</button>
      <p id="location"></p>
      <button onClick={currLocation}>Get Current Location</button>

    </div>
  );
}