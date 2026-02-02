"use client";

import Link from "next/link";
import { Home, LayoutDashboard, LogIn, LogOut, Menu } from "lucide-react";
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
import { useState } from "react";

export function MobileHeader() {
  const { user, userProfile } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    setOpen(false);
  };
  
  const navItems = [
    { href: "/", icon: Home, label: "Home" },
  ];

  if (userProfile?.role === 'business') {
    navItems.push({ href: "/dashboard", icon: LayoutDashboard, label: "My Dashboard" });
  }

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
          <SheetHeader className="mb-8">
            <Logo />
          </SheetHeader>
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Button key={item.label} variant="ghost" className="justify-start gap-4 p-4 text-left text-lg" asChild onClick={() => setOpen(false)}>
                <Link href={item.href}>
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
             {!user ? (
                <Button variant="ghost" className="justify-start gap-4 p-4 text-left text-lg" asChild onClick={() => setOpen(false)}>
                    <Link href="/login">
                    <LogIn className="h-6 w-6" />
                    <span>Login / Sign Up</span>
                    </Link>
                </Button>
             ) : (
                <Button variant="ghost" onClick={handleLogout} className="justify-start gap-4 p-4 text-left text-lg">
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
