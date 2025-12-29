'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { findUserByEmail, createUser as createNewUser, createOrder as createNewOrder, validateAndUseTicket as validateTicketInDb } from './data';

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

        if (result.success) {
            return { status: 'success', message: result.message, eventName: result.event?.name };
        } else {
            return { status: 'error', message: result.message, eventName: result.event?.name };
        }
    } catch (error) {
        return { status: 'error', message: 'Invalid QR code. Please scan a valid Event Go ticket.' };
    }
}
