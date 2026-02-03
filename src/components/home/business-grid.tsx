
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { mockBusinesses } from "@/lib/data";
import type { Business, BusinessCategory } from "@/lib/types";
import { getDistanceFromLatLonInKm } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPinOff, LocateFixed, Sparkles } from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AIAssistant } from "./ai-assistant";
import { Badge } from "@/components/ui/badge";

const categories: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 'Others'
];

export function BusinessGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const firestore = useFirestore();

  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: realBusinesses, isLoading: loadingRealData } = useCollection<Business>(businessesRef);

  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isDistanceFilterActive, setIsDistanceFilterActive] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation access denied or failed:", error.message);
        }
      );
    }
  }, []);

  const filteredBusinesses = useMemo(() => {
    let businesses: Business[] = realBusinesses ? [...realBusinesses] : [];
    
    if (businesses.length === 0 && !loadingRealData) {
      businesses = [...mockBusinesses];
    }

    if (userLocation && isDistanceFilterActive) {
      businesses = businesses.filter((business) => {
        if (!business?.latitude || !business?.longitude) return false;
        const distance = getDistanceFromLatLonInKm(
          userLocation.latitude,
          userLocation.longitude,
          business.latitude,
          business.longitude
        );
        return distance <= 5;
      });
    }

    // Sort by premium first, then views
    businesses.sort((a, b) => {
      if (a.isPaid && !b.isPaid) return -1;
      if (!a.isPaid && b.isPaid) return 1;
      return (b.views || 0) - (a.views || 0);
    });

    return businesses.filter((business) => {
      if (!business) return false;
      const shopName = business.shopName || "";
      const matchesCategory = !selectedCategory || business.category === selectedCategory;
      const matchesSearch = shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (business.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, userLocation, isDistanceFilterActive, realBusinesses, loadingRealData]);

  const handleAISuggestion = (category: BusinessCategory | null, search: string) => {
    setSelectedCategory(category);
    setSearchTerm(search);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 space-y-6">
        <div className="text-center space-y-2">
           <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5 px-4">
            <Sparkles className="h-3 w-3 mr-2" /> Hyperlocal Marketplace
           </Badge>
           <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-navy">
             Find Anything <span className="text-primary">Locally</span>
           </h1>
           <p className="text-muted-foreground max-w-xl mx-auto">
             Real shops. Verified services. Directly from your neighborhood.
           </p>
        </div>

        <div className="relative max-w-2xl mx-auto group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search for 'Haircut', 'Pizza', 'Repair'..."
            className="pl-12 h-16 text-lg rounded-2xl shadow-lg border-2 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          {userLocation && (
            <Button
                variant={isDistanceFilterActive ? "secondary" : "outline"}
                onClick={() => setIsDistanceFilterActive(prev => !prev)}
                className="rounded-full shadow-sm"
              >
                {isDistanceFilterActive ? <MapPinOff className="mr-2 h-4 w-4"/> : <LocateFixed className="mr-2 h-4 w-4"/>}
                {isDistanceFilterActive ? 'Show All' : 'Nearby Shops'}
            </Button>
           )}
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(prev => prev === category ? null : category)}
              className="rounded-full text-xs h-9 px-4 shadow-sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {loadingRealData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/30 rounded-3xl border-2 border-dashed">
          <h2 className="text-3xl font-black mb-2">No results for "{searchTerm}"</h2>
          <p className="text-muted-foreground">Try asking the AI assistant for suggestions!</p>
          <Button variant="outline" className="mt-6" onClick={() => {setSearchTerm(""); setSelectedCategory(null);}}>
            Reset Filters
          </Button>
        </div>
      )}

      <AIAssistant onSuggest={handleAISuggestion} />
    </div>
  );
}
