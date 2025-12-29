'use client';

import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket as TicketIcon, Calendar, MapPin } from 'lucide-react';
import type { Event, Ticket, TicketType } from '@/lib/types';
import { Separator } from './ui/separator';

type TicketCardProps = {
  ticket: Ticket;
  event: Event;
};

export default function TicketCard({ ticket, event }: TicketCardProps) {
  const ticketType = event.ticketTypes.find(tt => tt.id === ticket.ticketTypeId);

  return (
    <Card className="overflow-hidden shadow-lg transition-all hover:shadow-xl">
      <CardContent className="p-0 md:flex">
        <div className="p-6 flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <TicketIcon className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold font-headline">{event.name}</h3>
          </div>
          <p className="text-sm font-semibold text-primary">{ticketType?.name}</p>

          <Separator className="my-4" />

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>{format(new Date(event.date), 'eee, MMM d, yyyy @ h:mm a')}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{event.location.name}</span>
            </div>
          </div>
        </div>
        <div className={`p-6 md:border-l ${ticket.status === 'used' ? 'bg-muted/50' : 'bg-background'} flex flex-col items-center justify-center`}>
          <div className="relative">
            <div className="bg-white p-4 rounded-md shadow-md">
                <QRCode
                    value={ticket.qrData}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="L"
                />
            </div>
            {ticket.status === 'used' && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <p className="text-2xl font-bold text-destructive -rotate-12 border-4 border-destructive px-4 py-2 rounded-md">USED</p>
                </div>
            )}
          </div>
           <p className="mt-4 text-xs text-muted-foreground">Show this code at the event entrance.</p>
           <p className="text-xs text-muted-foreground">ID: {ticket.id}</p>
        </div>
      </CardContent>
    </Card>
  );
}
