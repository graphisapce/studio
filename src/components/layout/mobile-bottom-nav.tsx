"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, userProfile } = useAuth();

  return (
    <nav className="fixed bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        <Link href="/" className="flex flex-col items-center gap-1">
          <Home className={cn("h-6 w-6", pathname === "/" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-xs font-medium", pathname === "/" ? "text-primary" : "text-muted-foreground")}>Home</span>
        </Link>
        {userProfile?.role === 'business' && (
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <LayoutDashboard className={cn("h-6 w-6", pathname === "/dashboard" ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs font-medium", pathname === "/dashboard" ? "text-primary" : "text-muted-foreground")}>Dashboard</span>
          </Link>
        )}
        <Link href="/login" className="flex flex-col items-center gap-1">
          <UserCircle className={cn("h-6 w-6", pathname === "/login" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-xs font-medium", pathname === "/login" ? "text-primary" : "text-muted-foreground")}>{user ? "Profile" : "Login"}</span>
        </Link>
      </div>
    </nav>
  );
}