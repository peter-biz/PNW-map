'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar({ currentBuilding }) {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: '#f0f0f0',
      borderBottom: '1px solid #ddd',
      padding: '10px 20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ margin: 0 }}>PNW Campus Map</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          {pathname === '/' && (
            <span style={{ 
              backgroundColor: '#fff',
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              Current Location: {currentBuilding}
            </span>
          )}
          <Link 
            href="/" 
            style={{
              color: pathname === '/' ? '#007bff' : '#333',
              textDecoration: 'none',
              fontWeight: pathname === '/' ? 'bold' : 'normal'
            }}
          >
            Map
          </Link>
          <Link 
            href="/events" 
            style={{
              color: pathname === '/events' ? '#007bff' : '#333',
              textDecoration: 'none',
              fontWeight: pathname === '/events' ? 'bold' : 'normal'
            }}
          >
            Events
          </Link>
        </div>
      </div>
    </nav>
  );
}