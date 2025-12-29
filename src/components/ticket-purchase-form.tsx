'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Event, TicketType } from '@/lib/types';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { purchaseTickets } from '@/lib/actions';
import { Plus, Minus } from 'lucide-react';

export default function TicketPurchaseForm({ event }: { event: Event }) {
  const [selections, setSelections] = useState<Record<string, number>>(
    event.ticketTypes.reduce((acc, tt) => ({ ...acc, [tt.id]: 0 }), {})
  );
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleQuantityChange = (ticketTypeId: string, delta: number) => {
    setSelections(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, (prev[ticketTypeId] || 0) + delta),
    }));
  };

  const total = event.ticketTypes.reduce((sum, tt) => {
    return sum + (selections[tt.id] || 0) * tt.price;
  }, 0);

  const totalTickets = Object.values(selections).reduce((sum, qty) => sum + qty, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const ticketSelections = Object.entries(selections)
        .filter(([, quantity]) => quantity > 0)
        .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    if (ticketSelections.length === 0) {
        toast({
            title: 'No tickets selected',
            description: 'Please select at least one ticket.',
            variant: 'destructive',
        });
        setIsPending(false);
        return;
    }

    const result = await purchaseTickets(event.id, ticketSelections);

    if (result.success) {
      toast({
        title: 'Purchase Successful!',
        description: 'Your tickets have been generated.',
      });
      router.push('/tickets');
      router.refresh(); // Refresh server components
    } else {
      toast({
        title: 'Purchase Failed',
        description: result.message,
        variant: 'destructive',
      });
    }

    setIsPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {event.ticketTypes.map(ticketType => (
          <div key={ticketType.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{ticketType.name}</p>
              <p className="text-sm text-muted-foreground">${ticketType.price.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(ticketType.id, -1)}
                disabled={selections[ticketType.id] === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-bold text-lg">{selections[ticketType.id]}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(ticketType.id, 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-xl font-bold">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending || totalTickets === 0}>
        {isPending ? 'Processing...' : `Buy ${totalTickets} Ticket${totalTickets !== 1 ? 's' : ''}`}
      </Button>
    </form>
  );
}
