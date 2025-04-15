"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const TrafficWidget = () => {
  const [trafficStatus, setTrafficStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        const response = await axios.get("/api/traffic");

        // Process response data
        const incidents = response.data.incidents || [];
        let status;

        if (incidents.length === 0) {
          status = {
            status: "All clear",
            color: "green",
            description: "No incidents reported",
          };
        } else if (incidents.length <= 2) {
          status = {
            status: "Congested",
            color: "yellow",
            description: `${incidents.length} incidents reported`,
          };
        } else {
          status = {
            status: "Standstill",
            color: "red",
            description: `${incidents.length} incidents reported`,
          };
        }

        setTrafficStatus(status);
        setLoading(false);
      } catch (error) {
        console.error("Traffic data fetch error:", error);

        // For demo purposes, set mock data if API fails
        setTrafficStatus({
          status: "All clear",
          color: "green",
          description: "No incidents reported",
        });
        setLoading(false);
      }
    };

    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="traffic-widget">Loading...</div>;
  if (error) return <div className="traffic-widget">{error}</div>;
  if (!trafficStatus) return null;

  return (
    <div className={`traffic-widget ${collapsed ? "collapsed" : ""}`}>
      <button
        className="slide-button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Show traffic" : "Hide traffic"}
      >
        {collapsed ? "◀" : "▶"}
      </button>

      <div className="widget-content">
        <div className="widget-header">
          <div className="widget-title">Traffic [Hammond, IN]</div>
        </div>

        <div className="traffic-status">
          <span
            className={`status-indicator ${
              trafficStatus.status === "All clear" ? "active" : ""
            }`}
            style={{
              backgroundColor:
                trafficStatus.status === "All clear" ? "green" : "#ddd",
            }}
          >
            All clear
          </span>
          <span
            className={`status-indicator ${
              trafficStatus.status === "Congested" ? "active" : ""
            }`}
            style={{
              backgroundColor:
                trafficStatus.status === "Congested" ? "yellow" : "#ddd",
            }}
          >
            Congested
          </span>
          <span
            className={`status-indicator ${
              trafficStatus.status === "Standstill" ? "active" : ""
            }`}
            style={{
              backgroundColor:
                trafficStatus.status === "Standstill" ? "red" : "#ddd",
            }}
          >
            Standstill
          </span>
        </div>

        <div className="traffic-description">{trafficStatus.description}</div>
      </div>

      <style jsx>{`
        .traffic-widget {
          position: fixed; /* Change from absolute to fixed */
          top: 180px;
          right: 0;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 8px 0 0 8px;
          box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          text-align: center;
          display: flex;
          transform: translateX(0);
          transition: transform 0.3s ease;
          max-width: 300px; /* Add max-width */
          width: auto; /* Let it size to content */
        }

        .traffic-widget.collapsed {
          transform: translateX(calc(100% - 20px));
        }

        .slide-button {
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          font-size: 14px;
          padding: 8px 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
        }

        .widget-content {
          padding: 12px;
          min-width: 180px;
        }

        .widget-header {
          margin-bottom: 8px;
        }

        .widget-title {
          font-weight: bold;
        }

        .traffic-status {
          display: flex;
          justify-content: space-between;
          gap: 4px;
          margin-bottom: 8px;
        }

        .status-indicator {
          padding: 4px;
          border-radius: 4px;
          font-size: 0.7em;
          color: ${trafficStatus.status === "Congested" ? "black" : "white"};
          flex: 1;
        }

        .status-indicator.active {
          font-weight: bold;
        }

        .traffic-description {
          font-size: 0.9em;
          color: #666;
        }

        @media (max-width: 640px) {
          .widget-content {
            min-width: 150px;
          }

          .status-indicator {
            font-size: 0.6em;
            padding: 3px 2px;
          }

          .traffic-widget {
            max-width: 80%;
          }
        }

        @media (max-width: 480px) {
          .widget-content {
            min-width: 100px;
            padding: 8px;
          }

          .slide-button {
            padding: 6px 2px;
          }
        }
      `}</style>
    </div>
  );
};

export default TrafficWidget;
