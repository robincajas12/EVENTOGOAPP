import { getSessionUser } from '@/lib/auth';
import { getEventById } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import EventForm from '@/components/admin/event-form';

export default async function EditEventPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const user = await getSessionUser();
  if (user?.role !== 'Admin') {
    redirect('/');
  }

  const { id } = searchParams;
  let event = null;

  if (id) {
    event = await getEventById(id);
    if (!event) {
      notFound();
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EventForm event={event} />
    </div>
  );
}
