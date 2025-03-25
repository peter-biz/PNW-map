'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Events() {
    useEffect(() => {
        console.log('Events page mounted');
    }, []);

    return (
        <div>
            <h1>Events Page</h1>
            <Link href="/" style={{ position: 'absolute', top: 10, right: 10 }}>
                Back to Map
            </Link>
            <p>Welcome to the events page!</p>
        </div>
    );
}