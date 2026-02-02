"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Skeleton } from "@/components/ui/skeleton";

function SplashScreen() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="space-y-4">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-8 w-64" />
            </div>
        </div>
    )
}


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isMobile === undefined) {
    return <SplashScreen />;
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
