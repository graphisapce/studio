"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useAuth } from "@/context/AuthContext";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);
  const { loading } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isMobile === undefined || loading) {
    // AuthProvider shows its own splash screen, but this can be a fallback.
    // We also wait for isMounted and isMobile to be determined.
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
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
