
"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Announcement } from "@/lib/types";
import { Megaphone, X } from "lucide-react";
import { useState } from "react";

export function AnnouncementBanner() {
  const { userProfile } = useAuth();
  const firestore = useFirestore();
  const [isVisible, setIsVisible] = useState(true);

  const announcementsRef = useMemoFirebase(() => 
    collection(firestore, "announcements"), 
    [firestore]
  );
  
  const { data: announcements } = useCollection<Announcement>(announcementsRef);

  const activeAnnouncement = useMemo(() => {
    if (!announcements || announcements.length === 0) return null;

    // Filter announcements that match user profile or are global
    const filtered = announcements.filter(a => {
      if (!a.isActive) return false;
      if (a.targetType === 'global') return true;
      
      if (!userProfile) return false;

      if (a.targetType === 'area') {
        const val = a.targetValue.toLowerCase();
        return (
          (userProfile.areaCode || "").toLowerCase() === val || 
          (userProfile.city || "").toLowerCase() === val
        );
      }

      if (a.targetType === 'pincode') {
        return userProfile.pincode === a.targetValue;
      }

      return false;
    });

    // Sort by newest
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [announcements, userProfile]);

  if (!isVisible || !activeAnnouncement) return null;

  return (
    <div className="bg-primary text-white py-2 px-4 relative overflow-hidden">
      <div className="container mx-auto flex items-center justify-center gap-3">
        <Megaphone className="h-4 w-4 shrink-0 animate-bounce" />
        <p className="text-xs md:text-sm font-black uppercase tracking-tight text-center line-clamp-1 pr-8">
          {activeAnnouncement.message}
        </p>
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Visual shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[marquee_5s_linear_infinite]" />
    </div>
  );
}
