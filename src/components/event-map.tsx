'use client';

import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Event } from '@/lib/types';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

export default function EventMap({ events }: { events: Event[] }) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  if (!API_KEY || !MAP_ID) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Map Not Available</h3>
          <p className="text-sm text-muted-foreground">
            Google Maps API Key is not configured.
          </p>
        </div>
      </div>
    );
  }
  
  const quitoPosition = { lat: -0.180653, lng: -78.467834 };

  return (
    <APIProvider apiKey={API_KEY}>
        <div className="w-full h-full rounded-lg overflow-hidden">
            <Map
                defaultZoom={12}
                defaultCenter={quitoPosition}
                mapId={MAP_ID}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                {events.map((event) => (
                    <AdvancedMarker 
                        key={event.id}
                        position={{ lat: event.location.lat, lng: event.location.lng }}
                        onClick={() => setSelectedEvent(event)}
                    />
                ))}

                {selectedEvent && (
                    <InfoWindow 
                        position={{ lat: selectedEvent.location.lat, lng: selectedEvent.location.lng }}
                        onCloseClick={() => setSelectedEvent(null)}
                    >
                        <div className="p-2 w-64">
                            <h4 className="font-bold text-md mb-1">{selectedEvent.name}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{format(new Date(selectedEvent.date), 'MMM d, yyyy')}</p>
                            <Button size="sm" asChild>
                                <Link href={`/events/${selectedEvent.id}`}>View Details</Link>
                            </Button>
                        </div>
                    </InfoWindow>
                )}
            </Map>
        </div>
    </APIProvider>
  );
}
