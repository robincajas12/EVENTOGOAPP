import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import Logo from './logo';
import { MainNav } from './main-nav';
import { UserNav } from './user-nav';
import { Button } from './ui/button';

export default async function AppHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Logo />
        <MainNav user={user} className="mx-6" />
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <UserNav user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
