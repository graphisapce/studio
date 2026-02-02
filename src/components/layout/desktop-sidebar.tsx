
"use client";
import Link from "next/link";
import { Home, LayoutDashboard, LogIn, LogOut, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/clientApp";

export function DesktopSidebar() {
  const { user, userProfile, loading } = useAuth();

  const handleLogout = () => auth.signOut();

  const isBusiness = userProfile?.role === 'business';

  return (
    <aside className="w-64 flex-col border-r bg-background p-4 hidden md:flex">
      <div className="p-4"><Logo /></div>
      <nav className="flex flex-col gap-2 mt-8">
        <Button variant="ghost" className="justify-start gap-3" asChild>
          <Link href="/"><Home className="h-5 w-5" /><span>Home</span></Link>
        </Button>
        
        {loading && user && (
          <div className="px-4 py-2 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs">Syncing profile...</span>
          </div>
        )}

        {!loading && user && isBusiness && (
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/dashboard"><LayoutDashboard className="h-5 w-5" /><span>My Dashboard</span></Link>
          </Button>
        )}

        {!user && !loading && (
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/login"><LogIn className="h-5 w-5" /><span>Login / Sign Up</span></Link>
          </Button>
        )}
      </nav>
      <div className="mt-auto p-4 text-sm border-t pt-4">
        {user && (
          <div className="flex flex-col gap-2">
            <p className="font-semibold truncate text-primary">{userProfile?.name || user.displayName || user.email}</p>
            <p className="text-xs text-muted-foreground capitalize mb-2">{userProfile?.role || 'User'}</p>
            <Button variant="ghost" onClick={handleLogout} className="justify-start p-0 h-auto text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5 mr-2" />Logout
            </Button>
          </div>
        )}
        <p className="text-muted-foreground mt-4 text-[10px]">&copy; {new Date().getFullYear()} LocalVyapar</p>
      </div>
    </aside>
  );
}
