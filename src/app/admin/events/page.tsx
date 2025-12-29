import Link from 'next/link';
import { getEvents } from '@/lib/data';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Database } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteEvent, seedDatabase } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";


function DeleteEventButton({ eventId }: { eventId: string }) {
  const deleteEventWithId = deleteEvent.bind(null, eventId);
  return (
    <form action={deleteEventWithId}>
      <button type="submit" className="w-full text-left text-destructive">
        Delete
      </button>
    </form>
  );
}

function SeedDatabaseButton() {
  return (
    <form action={seedDatabase}>
      <Button variant="outline" size="sm">
        <Database className="mr-2 h-4 w-4" />
        Seed Database
      </Button>
    </form>
  );
}


export default async function AdminEventsPage() {
  const user = await getSessionUser();
  if (user?.role !== 'Admin') {
    redirect('/');
  }

  let events = [];
  try {
    events = await getEvents(true); // include past events
  } catch(e) {
      // If db is not connected, it will throw. We can show an empty state.
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Event Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage all events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SeedDatabaseButton />
          <Button asChild>
            <Link href="/admin/events/edit">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>
            A list of all events in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length > 0 ? events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    {format(new Date(event.date), 'PPpp')}
                  </TableCell>
                  <TableCell>{event.location.name}</TableCell>
                  <TableCell className="text-right">
                    {event.capacity.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/events/edit?id=${event.id}`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href={`/events/${event.id}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <DeleteEventButton eventId={event.id} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        No events found. You might need to connect to a database and seed it.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
