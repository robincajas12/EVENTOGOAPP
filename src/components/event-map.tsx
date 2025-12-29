'use client';

import React, { useEffect, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";
import type { Event } from '@/lib/types';
import { Button } from './ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import ReactDOMServer from 'react-dom/server';


export default function EventMap({ events }: { events: Event[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const quitoPosition: L.LatLngTuple = [-0.180653, -78.467834];
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Initialize the map only if it hasn't been initialized yet
      mapInstance.current = L.map(mapRef.current).setView(quitoPosition, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance.current);
    }
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    if (mapInstance.current) {
        events.forEach((event) => {
            const popupContent = document.createElement('div');
            popupContent.innerHTML = ReactDOMServer.renderToString(
                <div className="p-1 w-60">
                    <h4 className="font-bold text-md mb-1">{event.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{format(new Date(event.date), 'MMM d, yyyy')}</p>
                    <Button size="sm" asChild>
                        <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                </div>
            );
            // This is a hack to make the link work in the popup
            const link = popupContent.querySelector('a');
            if(link) {
                link.href = `/events/${event.id}`;
            }

            const marker = L.marker([event.location.lat, event.location.lng])
              .addTo(mapInstance.current!)
              .bindPopup(popupContent);
            
            markersRef.current.push(marker);
        });
    }

    // Don't add a cleanup function to remove the map instance here,
    // as we want it to persist across re-renders. 
    // It will be cleaned up when the component fully unmounts.

  }, [events]); // Re-run effect whenever events prop changes

  // Cleanup map instance on component unmount
  useEffect(() => {
    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    }
  }, []);

  return <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />;
}
