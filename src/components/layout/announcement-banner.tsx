
"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Announcement } from "@/lib/types";
import { Megaphone, X, Youtube, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AnnouncementBanner() {
  const { userProfile } = useAuth();
  const firestore = useFirestore();
  const [isVisible, setIsVisible] = useState(true);

  const announcementsRef = useMemoFirebase(() => 
    collection(firestore, "announcements"), 
    [firestore]
  );
  
  const { data: announcements } = useCollection<Announcement>(announcementsRef);

  const activeAnnouncements = useMemo(() => {
    if (!announcements || announcements.length === 0) return [];

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

    // Sort: Targeted messages first, then newest
    return filtered.sort((a, b) => {
      if (a.targetType !== 'global' && b.targetType === 'global') return -1;
      if (a.targetType === 'global' && b.targetType !== 'global') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [announcements, userProfile]);

  // Show the most relevant announcement
  const currentAnnouncement = activeAnnouncements[0];

  const getYoutubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (!isVisible || !currentAnnouncement) return null;

  const embedId = currentAnnouncement.videoUrl ? getYoutubeEmbedId(currentAnnouncement.videoUrl) : null;

  return (
    <div className="bg-primary text-white py-2 px-4 relative overflow-hidden shadow-sm">
      <div className="container mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Megaphone className="h-4 w-4 shrink-0 animate-bounce" />
          <p className="text-xs md:text-sm font-black uppercase tracking-tight line-clamp-1">
            {currentAnnouncement.message}
          </p>
          
          {embedId && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2 bg-white/20 hover:bg-white/30 text-[10px] font-black uppercase gap-1 rounded-full border border-white/30 shrink-0">
                  <PlayCircle className="h-3.5 w-3.5 text-red-400 fill-white" /> Watch Video
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl p-0 bg-black overflow-hidden border-none">
                <DialogHeader className="p-4 bg-white/10 text-white border-b border-white/10">
                  <DialogTitle className="text-sm font-black uppercase flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-red-500" /> Video Announcement
                  </DialogTitle>
                </DialogHeader>
                <div className="relative aspect-video w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${embedId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <button 
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Visual shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[marquee_10s_linear_infinite] pointer-events-none" />
    </div>
  );
}
