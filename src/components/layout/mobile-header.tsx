
"use client";

import Link from "next/link";
import { useState } from "react";
import { Home, LayoutDashboard, LogIn, LogOut, Menu, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/clientApp";

export function MobileHeader() {
  const { user, userProfile, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    setOpen(false);
  };
  
  const isBusiness = userProfile?.role === 'business';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
      <Logo />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader className="mb-8 border-b pb-4">
            <Logo />
            {user && (
              <div className="mt-4 text-left px-2">
                <p className="font-bold text-primary truncate">{userProfile?.name || user.displayName || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{userProfile?.role || 'User'}</p>
              </div>
            )}
          </SheetHeader>
          <nav className="flex flex-col gap-2">
            <Button variant="ghost" className="justify-start gap-4 p-4 text-left text-lg" asChild onClick={() => setOpen(false)}>
                <Link href="/">
                  <Home className="h-6 w-6" />
                  <span>Home</span>
                </Link>
            </Button>
             
            {loading && user && (
               <div className="flex items-center gap-2 p-4 text-muted-foreground">
                 <Loader2 className="h-5 w-5 animate-spin text-primary" />
                 <span>Syncing role...</span>
               </div>
            )}

            {!loading && user && isBusiness && (
              <Button variant="ghost" className="justify-start gap-4 p-4 text-left text-lg" asChild onClick={() => setOpen(false)}>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-6 w-6" />
                  <span>My Dashboard</span>
                </Link>
              </Button>
            )}

             {!user && !loading ? (
                <Button variant="ghost" className="justify-start gap-4 p-4 text-left text-lg" asChild onClick={() => setOpen(false)}>
                    <Link href="/login">
                    <LogIn className="h-6 w-6" />
                    <span>Login / Sign Up</span>
                    </Link>
                </Button>
             ) : user && (
                <Button variant="ghost" onClick={handleLogout} className="justify-start gap-4 p-4 text-left text-lg text-destructive hover:bg-destructive/10">
                    <LogOut className="h-6 w-6" />
                    <span>Logout</span>
                </Button>
             )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
