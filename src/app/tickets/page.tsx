import { getSessionUser } from '@/lib/auth';
import { getTicketsByUserId, getEventById } from '@/lib/data';
import { redirect } from 'next/navigation';
import TicketCard from '@/components/ticket-card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function MyTicketsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const userTickets = await getTicketsByUserId(user.id);

  // Enrich tickets with event data
  const enrichedTickets = await Promise.all(
    userTickets.map(async (ticket) => {
      const event = await getEventById(ticket.eventId);
      return { ...ticket, event };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tight mb-8 font-headline">
        My Tickets
      </h1>
      {enrichedTickets.length > 0 ? (
        <div className="space-y-6">
          {enrichedTickets.map((ticket) =>
            ticket.event ? <TicketCard key={ticket.id} ticket={ticket} event={ticket.event} /> : null
          )}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">You don't have any tickets yet.</h2>
          <p className="text-muted-foreground mb-4">Why not find an event to attend?</p>
          <Button asChild>
            <Link href="/">Browse Events</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
