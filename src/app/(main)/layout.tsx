"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useAuth } from "@/context/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { loading } = useAuth();

  // The AuthProvider already shows a splash screen, so we don't need another one.
  // We wait for `isMobile` to be determined on the client to avoid a layout flash.
  // Returning `null` is faster than a full loading component.
  if (isMobile === undefined || loading) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-secondary/20">
      {!isMobile && <DesktopSidebar />}
      <div className="flex-1 flex flex-col">
        {isMobile && <MobileHeader />}
        <main className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
          {children}
        </main>
      </div>
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
