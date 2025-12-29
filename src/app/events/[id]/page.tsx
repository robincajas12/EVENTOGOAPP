import Image from 'next/image';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { getEventById } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Calendar, MapPin, Users, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TicketPurchaseForm from '@/components/ticket-purchase-form';

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) {
    notFound();
  }

  const placeholderImage = PlaceHolderImages.find(p => p.id === event.image);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden shadow-lg mb-6">
            {placeholderImage && (
              <Image
                src={placeholderImage.imageUrl}
                alt={placeholderImage.description}
                data-ai-hint={placeholderImage.imageHint}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 font-headline">{event.name}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        </div>
        <div className="md:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Calendar className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{format(new Date(event.date), 'eeee, MMMM d, yyyy')}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'h:mm a')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{event.location.name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Users className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{event.capacity.toLocaleString()} Capacity</p>
                </div>
              </div>
              <div className="flex items-start">
                <Ticket className="mr-3 mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Tickets</p>
                   <ul className="text-sm text-muted-foreground">
                    {event.ticketTypes.map(t => (
                        <li key={t.id}>{t.name}: ${t.price.toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Get Your Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketPurchaseForm event={event} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
