import EventCard from "@/components/event-card";
import { getEvents } from "@/lib/data";

export default async function Home() {
  const events = await getEvents();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tight mb-8 font-headline">
        Upcoming Events
      </h1>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">No Events Found</h2>
          <p className="text-muted-foreground">Please check back later for new and exciting events.</p>
        </div>
      )}
    </div>
  );
}
