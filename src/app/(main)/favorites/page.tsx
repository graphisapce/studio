"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { BusinessCard } from "@/components/home/business-card";
import { Heart, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const firestore = useFirestore();

  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: allBusinesses, isLoading: loadingBusinesses } = useCollection(businessesRef);

  const favoriteBusinesses = useMemo(() => {
    if (!allBusinesses || !userProfile?.favorites) return [];
    return allBusinesses.filter(b => userProfile.favorites?.includes(b.id));
  }, [allBusinesses, userProfile]);

  if (authLoading || loadingBusinesses) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your favorites...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-2xl font-bold mb-2">Login to see favorites</h2>
        <p className="text-muted-foreground mb-6">Aap apni pasandida dukanon ko save karke yahan dekh sakte hain.</p>
        <Button asChild><Link href="/login">Login Now</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-50 text-red-500 rounded-xl">
          <Heart className="h-8 w-8 fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-headline">My Favorite Shops</h1>
          <p className="text-muted-foreground">Dukane jo aapko pasand hain.</p>
        </div>
      </div>

      {favoriteBusinesses.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-lg font-bold">Abhi tak koi dukan pasand nahi ki?</h3>
          <p className="text-muted-foreground mb-6">Dukanon ke profile par Heart icon daba kar unhe yahan save karein.</p>
          <Button asChild variant="outline"><Link href="/">Explore Shops</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {favoriteBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
