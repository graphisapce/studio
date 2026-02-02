"use client";

import Link from "next/link";
import { Home, LayoutDashboard, LogIn, Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/dashboard", icon: LayoutDashboard, label: "My Dashboard" },
  { href: "/login", icon: LogIn, label: "Login / Sign Up" },
];

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
      <Logo />
      <Sheet>
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
              <Button key={item.label} variant="ghost" className="justify-start gap-4 p-4 text-left text-lg" asChild>
                <Link href={item.href}>
                  <item.icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
