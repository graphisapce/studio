"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
  ];

  if (userProfile?.role === 'business') {
    navItems.push({ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" });
  }

  navItems.push({ href: "/login", icon: UserCircle, label: user ? "Profile" : "Login" });

  return (
    <nav className="fixed bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 text-muted-foreground">
              <item.icon className={cn("h-6 w-6", isActive && "text-primary")} />
              <span className={cn("text-xs font-medium", isActive && "text-primary")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
