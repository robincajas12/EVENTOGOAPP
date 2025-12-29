import { cookies } from 'next/headers';
import { findUserById } from './data';
import type { User } from './types';

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get('session-user-id')?.value;

  if (!userId) {
    return null;
  }

  try {
    const user = await findUserById(userId);
    return user || null;
  } catch (error) {
    console.error('Failed to fetch session user:', error);
    return null;
  }
}
