
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, UserCircle, Loader2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, userProfile, loading, isSyncing } = useAuth();

  const isBusiness = useMemo(() => userProfile?.role === 'business', [userProfile]);

  const profileLink = useMemo(() => {
    if (!user) return "/login";
    if (isBusiness) return "/dashboard";
    return "/customer-dashboard";
  }, [user, isBusiness]);

  return (
    <nav className="fixed bottom-0 z-10 w-full border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        <Link href="/" className="flex flex-col items-center gap-1">
          <Home className={cn("h-6 w-6", pathname === "/" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-xs font-medium", pathname === "/" ? "text-primary" : "text-muted-foreground")}>Home</span>
        </Link>
        
        <Link href="/favorites" className="flex flex-col items-center gap-1">
          <Heart className={cn("h-6 w-6", pathname === "/favorites" ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-xs font-medium", pathname === "/favorites" ? "text-primary" : "text-muted-foreground")}>Favs</span>
        </Link>
        
        {user && isBusiness && (
          <Link href="/dashboard" className="flex flex-col items-center gap-1">
            <LayoutDashboard className={cn("h-6 w-6", pathname === "/dashboard" ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs font-medium", pathname === "/dashboard" ? "text-primary" : "text-muted-foreground")}>Business</span>
          </Link>
        )}

        <Link href={profileLink} className="flex flex-col items-center gap-1">
          <UserCircle className={cn("h-6 w-6", pathname === profileLink ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-xs font-medium", pathname === profileLink ? "text-primary" : "text-muted-foreground")}>
            {user ? "Profile" : "Login"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
