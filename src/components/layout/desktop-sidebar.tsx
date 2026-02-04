
"use client";
import Link from "next/link";
import { Home, LayoutDashboard, LogIn, LogOut, Loader2, ShieldAlert, UserCircle, Truck, Package } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/clientApp";
import { useMemo } from "react";

export function DesktopSidebar() {
  const { user, userProfile, loading, isSyncing } = useAuth();

  const handleLogout = () => auth.signOut();

  const isBusiness = useMemo(() => userProfile?.role === 'business', [userProfile]);
  const isDelivery = useMemo(() => userProfile?.role === 'delivery-boy', [userProfile]);
  const canManage = useMemo(() => userProfile && ['admin', 'moderator'].includes(userProfile.role), [userProfile]);

  return (
    <aside className="w-64 flex-col border-r bg-background p-4 hidden md:flex h-screen sticky top-0">
      <div className="p-4"><Logo /></div>
      <nav className="flex flex-col gap-2 mt-8">
        <Button variant="ghost" className="justify-start gap-3" asChild>
          <Link href="/"><Home className="h-5 w-5" /><span>Home</span></Link>
        </Button>
        
        {(isSyncing || loading) && user && (
          <div className="px-4 py-2 flex items-center gap-2 text-muted-foreground opacity-60">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs">Syncing profile...</span>
          </div>
        )}

        {user && !isBusiness && !isDelivery && (
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/orders"><Package className="h-5 w-5" /><span>My Orders</span></Link>
          </Button>
        )}

        {user && isBusiness && (
          <Button variant="ghost" className="justify-start gap-3 bg-primary/5 text-primary hover:bg-primary/10" asChild>
            <Link href="/dashboard"><LayoutDashboard className="h-5 w-5" /><span>Business Dashboard</span></Link>
          </Button>
        )}

        {user && isDelivery && (
          <Button variant="ghost" className="justify-start gap-3 bg-orange-50 text-orange-600 hover:bg-orange-100" asChild>
            <Link href="/delivery-dashboard"><Truck className="h-5 w-5" /><span>Delivery Panel</span></Link>
          </Button>
        )}

        {user && userProfile?.role === 'customer' && (
          <Button variant="ghost" className="justify-start gap-3 bg-primary/5 text-primary hover:bg-primary/10" asChild>
            <Link href="/customer-dashboard"><UserCircle className="h-5 w-5" /><span>My Account</span></Link>
          </Button>
        )}

        {user && canManage && (
          <Button variant="ghost" className="justify-start gap-3 bg-red-50 text-red-600 hover:bg-red-100" asChild>
            <Link href="/admin"><ShieldAlert className="h-5 w-5" /><span>Admin Panel</span></Link>
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
            <p className="font-semibold truncate text-primary">
              {userProfile?.name || user.displayName || user.email}
            </p>
            {userProfile && (
              <p className="text-[10px] text-muted-foreground uppercase font-black">
                {userProfile.role} Account
              </p>
            )}
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
