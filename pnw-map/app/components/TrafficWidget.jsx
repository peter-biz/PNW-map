'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const TrafficWidget = () => {
  const [trafficStatus, setTrafficStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        const response = await axios.get('/api/traffic');
        
        // Process response data
        const incidents = response.data.incidents || [];
        let status;
        
        if (incidents.length === 0) {
          status = { status: 'All clear', color: 'green', description: 'No incidents reported' };
        } else if (incidents.length <= 2) {
          status = { status: 'Congested', color: 'yellow', description: `${incidents.length} incidents reported` };
        } else {
          status = { status: 'Standstill', color: 'red', description: `${incidents.length} incidents reported` };
        }
        
        setTrafficStatus(status);
        setLoading(false);
      } catch (error) {
        console.error('Traffic data fetch error:', error);
        
        // Uncomment to show error instead of mock data
        setError('Failed to load traffic data');
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
    <div className="traffic-widget">
      <div className="traffic-location">Traffic [Hammond, IN]</div>
      <div className="traffic-status">
        <span 
          className={`status-indicator ${trafficStatus.status === 'All clear' ? 'active' : ''}`}
          style={{ backgroundColor: trafficStatus.status === 'All clear' ? 'green' : '#ddd' }}
        >
          All clear
        </span>
        <span 
          className={`status-indicator ${trafficStatus.status === 'Congested' ? 'active' : ''}`}
          style={{ backgroundColor: trafficStatus.status === 'Congested' ? 'yellow' : '#ddd' }}
        >
          Congested
        </span>
        <span 
          className={`status-indicator ${trafficStatus.status === 'Standstill' ? 'active' : ''}`}
          style={{ backgroundColor: trafficStatus.status === 'Standstill' ? 'red' : '#ddd' }}
        >
          Standstill
        </span>
      </div>
      <div className="traffic-description">{trafficStatus.description}</div>
      <style jsx>{`
        .traffic-widget {
          position: absolute;
          top: 180px;
          right: 20px;
          background-color: rgba(255, 255, 255, 0.9);
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 1000;
          min-width: 250px;
          text-align: center;
        }
        .traffic-location {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .traffic-status {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          color: ${trafficStatus.status === 'Congested' ? 'black' : 'white'};
        }
        .status-indicator.active {
          font-weight: bold;
        }
        .traffic-description {
          font-size: 0.9em;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default TrafficWidget;