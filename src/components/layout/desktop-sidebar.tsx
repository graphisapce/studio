"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Home, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/clientApp";

export function DesktopSidebar() {
  const { user, userProfile } = useAuth();

  const handleLogout = () => auth.signOut();

  const navItems = useMemo(() => {
    const items = [
      { href: "/", icon: Home, label: "Home" },
    ];

    if (userProfile?.role === 'business') {
      items.push({ href: "/dashboard", icon: LayoutDashboard, label: "My Dashboard" });
    }

    return items;
  }, [userProfile]);

  return (
    <aside className="w-64 flex-col border-r bg-background p-4 hidden md:flex">
      <div className="p-4">
        <Logo />
      </div>
      <nav className="flex flex-col gap-2 mt-8">
        {navItems.map((item) => (
          <Button key={item.label} variant="ghost" className="justify-start gap-3 px-4 py-2 text-left" asChild>
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        ))}
        {!user && (
          <Button variant="ghost" className="justify-start gap-3 px-4 py-2 text-left" asChild>
            <Link href="/login">
              <LogIn className="h-5 w-5" />
              <span>Login / Sign Up</span>
            </Link>
          </Button>
        )}
      </nav>
      <div className="mt-auto p-4 text-center text-sm">
        {user && (
          <div className="flex flex-col items-start text-left mb-4">
             <p className="font-semibold truncate text-foreground mb-2" title={user.email || ''}>{user.displayName || user.email}</p>
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 px-0 py-2 h-auto text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        )}
        <p className="text-muted-foreground">&copy; {new Date().getFullYear()} LocalVyapar</p>
      </div>
    </aside>
  );
}
