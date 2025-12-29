'use client';
import Link from 'next/link';
import { useSession } from '@/hooks/use-session';
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
import { deleteEvent, seedDatabase, getEventsAction } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from 'react';
import { Event } from '@/lib/types';


function DeleteEventButton({ eventId }: { eventId: string }) {
  const { token } = useSession();
  const { toast } = useToast();
  const deleteEventWithId = async () => {
     try {
      await deleteEvent(eventId, token);
      toast({
        title: 'Event Deleted',
        description: 'The event has been successfully deleted.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'Failed to delete event.',
      });
    }
  }
  return (
    <button onClick={deleteEventWithId} className="w-full text-left text-destructive">
      Delete
    </button>
  );
}

function SeedDatabaseButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSeed = () => {
    startTransition(async () => {
      const result = await seedDatabase();
      if (result.success) {
        toast({
          title: "Database Seeded",
          description: "The sample events and users have been created."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Seeding Failed",
          description: result.message
        });
      }
    });
  }

  return (
      <Button onClick={handleSeed} variant="outline" size="sm" disabled={isPending}>
        <Database className="mr-2 h-4 w-4" />
        {isPending ? 'Seeding...' : 'Seed Database'}
      </Button>
  );
}


export default function AdminEventsPage() {
  const { user, token, loading } = useSession();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!loading && user?.role !== 'Admin') {
      redirect('/');
    }
  }, [user, loading]);
  
  useEffect(() => {
    if (user?.role === 'Admin') {
      startTransition(async () => {
          try {
              const fetchedEvents = await getEventsAction(true, user.id); // include past events, filtered by user
              setEvents(fetchedEvents);
          } catch(e) {
              toast({
                variant: 'destructive',
                title: 'Failed to load events',
                description: 'Could not connect to the database. Please try seeding the database or check your connection string.'
              })
          }
      });
    }
  }, [user, toast]);

  if (loading || !user) {
    return <div>Loading...</div>
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Event Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage your events.
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
          <CardTitle>My Events</CardTitle>
          <CardDescription>
            A list of all events you have created.
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
              {isPending ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Loading events...
                    </TableCell>
                </TableRow>
              ) : events.length > 0 ? events.map((event) => (
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
                        You have not created any events yet.
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
