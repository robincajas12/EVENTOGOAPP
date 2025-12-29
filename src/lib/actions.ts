'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { findUserByEmail, createNewUser, createOrder as createNewOrder, validateAndUseTicket as validateTicketInDb, createEvent as createEventInDb, updateEvent as updateEventInDb, deleteEvent as deleteEventFromDb } from './data';
import { revalidatePath } from 'next/cache';
import type { Event } from './types';

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const user = await findUserByEmail(email);

  if (!user || user.password !== password) {
    return {
      errors: {
        email: ['Invalid email or password.'],
      },
    };
  }

  cookies().set('session-user-id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // One week
    path: '/',
  });
  
  redirect('/');
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function register(prevState: any, formData: FormData) {
  const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return {
      errors: {
        email: ['A user with this email already exists.'],
      },
    };
  }
  
  const user = await createNewUser(name, email, password);

  cookies().set('session-user-id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  redirect('/');
}

export async function logout() {
  cookies().delete('session-user-id');
  redirect('/login');
}

export async function purchaseTickets(eventId: string, ticketSelections: {ticketTypeId: string, quantity: number}[]) {
  const userId = cookies().get('session-user-id')?.value;
  if (!userId) {
    return { success: false, message: 'You must be logged in to purchase tickets.' };
  }
  
  try {
    await createNewOrder(userId, eventId, ticketSelections);
    revalidatePath('/tickets');
    return { success: true, message: 'Tickets purchased successfully!' };
  } catch(error) {
    return { success: false, message: (error as Error).message || 'An unknown error occurred.' };
  }
}

export async function validateTicket(prevState: any, formData: FormData) {
    const qrData = formData.get('qrData') as string;
    if (!qrData) {
        return { status: 'error', message: 'QR data is missing.' };
    }

    try {
        const { ticketId } = JSON.parse(qrData);
        if (!ticketId) {
            return { status: 'error', message: 'Invalid QR data format.' };
        }

        const result = await validateTicketInDb(ticketId);
        revalidatePath('/tickets');

        if (result.success) {
            return { status: 'success', message: result.message, eventName: result.event?.name };
        } else {
            return { status: 'error', message: result.message, eventName: result.event?.name };
        }
    } catch (error) {
        return { status: 'error', message: 'Invalid QR code. Please scan a valid Event Go ticket.' };
    }
}

const eventSchema = z.object({
    name: z.string().min(3, 'Event name must be at least 3 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date.'),
    locationName: z.string().min(3, 'Location name is required.'),
    locationLat: z.coerce.number().min(-90).max(90),
    locationLng: z.coerce.number().min(-180).max(180),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.'),
    image: z.string().min(1, 'Image placeholder is required.'),
    ticketTypes: z.string().min(1, 'At least one ticket type is required.')
});

export async function createEvent(formData: FormData) {
    const validated = eventSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validated.success) {
        return { success: false, message: 'Invalid data.', errors: validated.error.flatten().fieldErrors };
    }

    const { ticketTypes, ...eventData } = validated.data;

    try {
        const newEvent: Omit<Event, 'id'> = {
            ...eventData,
            date: new Date(validated.data.date),
            location: {
                name: validated.data.locationName,
                lat: validated.data.locationLat,
                lng: validated.data.locationLng,
            },
            ticketTypes: JSON.parse(ticketTypes),
        };
        await createEventInDb(newEvent);
        revalidatePath('/admin/events');
    } catch (e) {
        return { success: false, message: 'Failed to create event.' };
    }
    redirect('/admin/events');
}

export async function updateEvent(id: string, formData: FormData) {
    const validated = eventSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validated.success) {
        return { success: false, message: 'Invalid data.', errors: validated.error.flatten().fieldErrors };
    }
    const { ticketTypes, ...eventData } = validated.data;
    try {
         const updatedEvent: Omit<Event, 'id'> = {
            ...eventData,
            date: new Date(validated.data.date),
            location: {
                name: validated.data.locationName,
                lat: validated.data.locationLat,
                lng: validated.data.locationLng,
            },
            ticketTypes: JSON.parse(ticketTypes),
        };
        await updateEventInDb(id, updatedEvent);
        revalidatePath('/admin/events');
        revalidatePath(`/events/${id}`);
    } catch (e) {
        return { success: false, message: 'Failed to update event.' };
    }
    redirect('/admin/events');
}

export async function deleteEvent(id: string) {
    try {
        await deleteEventFromDb(id);
        revalidatePath('/admin/events');
    } catch (e) {
        // This will be caught by a higher-level error boundary
        throw new Error('Failed to delete event.');
    }
}
