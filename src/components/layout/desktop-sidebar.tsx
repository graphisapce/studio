"use client";
import Link from "next/link";
import { Home, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/clientApp";

export function DesktopSidebar() {
  const { user, userProfile } = useAuth();

  const handleLogout = () => auth.signOut();

  return (
    <aside className="w-64 flex-col border-r bg-background p-4 hidden md:flex">
      <div className="p-4"><Logo /></div>
      <nav className="flex flex-col gap-2 mt-8">
        <Button variant="ghost" className="justify-start gap-3" asChild>
          <Link href="/"><Home className="h-5 w-5" /><span>Home</span></Link>
        </Button>
        {userProfile?.role === 'business' && (
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/dashboard"><LayoutDashboard className="h-5 w-5" /><span>My Dashboard</span></Link>
          </Button>
        )}
        {!user && (
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/login"><LogIn className="h-5 w-5" /><span>Login / Sign Up</span></Link>
          </Button>
        )}
      </nav>
      <div className="mt-auto p-4 text-sm">
        {user && (
          <div className="flex flex-col gap-2">
            <p className="font-semibold truncate">{user.displayName || user.email}</p>
            <Button variant="ghost" onClick={handleLogout} className="justify-start p-0 h-auto text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5 mr-2" />Logout
            </Button>
          </div>
        )}
        <p className="text-muted-foreground mt-4">&copy; {new Date().getFullYear()} LocalVyapar</p>
      </div>
    </aside>
  );
}