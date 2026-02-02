"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useAuth } from "@/context/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { user, userProfile, loading } = useAuth();

  // If we have a user but no profile yet while loading, wait for it
  // This ensures navigation items correctly show based on role
  if (isMobile === undefined || (loading && user && !userProfile)) {
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
