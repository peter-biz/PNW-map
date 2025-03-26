'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import ICAL from 'ical.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import Navbar from '../components/Navbar';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Use a proxy URL or backend endpoint to fetch the ICS file
                const response = await axios.get('/api/events');
                const icsData = response.data;
                
                // Parse ICS data
                const jcalData = ICAL.parse(icsData);
                const comp = new ICAL.Component(jcalData);
                const vevents = comp.getAllSubcomponents('vevent');
                
                // Convert to FullCalendar format
                const calendarEvents = vevents.map(vevent => {
                    const event = new ICAL.Event(vevent);
                    return {
                        title: event.summary,
                        start: event.startDate.toJSDate(),
                        end: event.endDate.toJSDate(),
                        description: event.description,
                        location: event.location
                    };
                });

                setEvents(calendarEvents);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching events:', err);
                setError('Failed to load events');
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <>
         <Navbar />
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap'
            }}>
                <h1 style={{ flex: '1 1 100%', textAlign: 'center' }}>PNW Events Calendar</h1>
                <Link 
                    href="/" 
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        marginTop: '10px'
                    }}
                >
                    Back to Map
                </Link>
            </div>

            {loading && <p>Loading events...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            
            <div style={{ height: '600px' }}>
                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    height="100%"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek,dayGridDay'
                    }}
                    eventClick={(info) => {
                        alert(
                            `Event: ${info.event.title}\n` +
                            `Location: ${info.event.extendedProps.location || 'N/A'}\n` +
                            `Description: ${info.event.extendedProps.description || 'N/A'}`
                        );
                    }}
                />
            </div>
        </div>
        <style jsx>{`
            @media (max-width: 600px) {
                h1 {
                    font-size: 1.5em;
                }
                .fc-toolbar {
                    flex-direction: column;
                }
                .fc-toolbar .fc-left,
                .fc-toolbar .fc-right {
                    margin-bottom: 10px;
                }
            }
        `}</style>
        </>
    );
}