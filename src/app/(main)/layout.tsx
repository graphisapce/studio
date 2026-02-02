
"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-secondary/20">
      {isMobile === false && <DesktopSidebar />}
      <div className="flex-1 flex flex-col">
        {isMobile === true && <MobileHeader />}
        <main className={`flex-1 ${isMobile === true ? 'pb-20' : ''}`}>
          {children}
        </main>
      </div>
      {isMobile === true && <MobileBottomNav />}
    </div>
  );
}
