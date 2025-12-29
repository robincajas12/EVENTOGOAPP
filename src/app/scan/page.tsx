import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TicketValidationForm from '@/components/ticket-validation-form';
import { ScanLine } from 'lucide-react';

export default async function ScanPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'Admin') {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
            <ScanLine className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Ticket Scanner</CardTitle>
          <CardDescription>
            Enter ticket data to validate for event entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketValidationForm />
        </CardContent>
      </Card>
    </div>
  );
}
