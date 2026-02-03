"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, limit, getDocs } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { mockBusinesses } from "@/lib/data";
import type { Business, BusinessCategory, PlatformConfig } from "@/lib/types";
import { getDistanceFromLatLonInKm, isBusinessPremium } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Navigation, Star, ShieldCheck, MapPinCheck, Megaphone } from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const categories: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 'Others'
];

export function BusinessGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const firestore = useFirestore();

  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: realBusinesses, isLoading: loadingRealData } = useCollection<Business>(businessesRef);

  // Fetch Platform Config
  useEffect(() => {
    const fetchConfig = async () => {
      const configRef = collection(firestore, "config");
      const snap = await getDocs(query(configRef, limit(1)));
      if (!snap.empty) {
        setPlatformConfig(snap.docs[0].data() as PlatformConfig);
      }
    };
    fetchConfig();
  }, [firestore]);

  // Auto-request location on mount
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
          console.warn("Geolocation access denied:", error.message);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const sortedAndFilteredBusinesses = useMemo(() => {
    let businesses: Business[] = realBusinesses ? [...realBusinesses] : [];
    
    if (businesses.length === 0 && !loadingRealData) {
      businesses = [...mockBusinesses];
    }

    let filtered = businesses.filter((business) => {
      if (!business) return false;
      const shopName = business.shopName || "";
      const matchesCategory = !selectedCategory || business.category === selectedCategory;
      const matchesSearch = shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (business.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    filtered.sort((a, b) => {
      const aPremium = isBusinessPremium(a);
      const bPremium = isBusinessPremium(b);

      if (aPremium && !bPremium) return -1;
      if (!aPremium && bPremium) return 1;

      if (userLocation && a.latitude && a.longitude && b.latitude && b.longitude) {
        const distA = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);

        const aNear = distA <= 1;
        const bNear = distB <= 1;

        if (aNear && !bNear) return -1;
        if (!aNear && bNear) return 1;

        return distA - distB;
      }

      return (b.views || 0) - (a.views || 0);
    });

    return filtered;
  }, [searchTerm, selectedCategory, userLocation, realBusinesses, loadingRealData]);

  return (
    <div className="container mx-auto px-4 py-8">
      {platformConfig?.announcement && (
        <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl mb-8 flex items-center gap-3 animate-pulse">
          <Megaphone className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs font-bold text-primary">{platformConfig.announcement}</p>
        </div>
      )}

      <div className="mb-10 space-y-6">
        <div className="text-center space-y-4">
           <div className="flex justify-center gap-2">
             <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-4 py-1">
              <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Verified Local Shops
             </Badge>
             {userLocation && (
               <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-4 py-1">
                <MapPinCheck className="h-3.5 w-3.5 mr-2" /> Live Location Active
               </Badge>
             )}
           </div>
           
           <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-navy">
             Aapke <span className="text-primary">Aas-Paas</span> Ki Dukanein
           </h1>
           <p className="text-muted-foreground max-w-xl mx-auto text-lg">
             {userLocation ? "Showing shops within 1km of your location first." : "Enable location to see shops near you."}
           </p>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Input
            placeholder="Search for 'Groceries', 'Salon', 'Mechanic'..."
            className="pl-14 h-16 text-lg rounded-2xl shadow-xl border-2 border-primary/10 focus-visible:ring-primary focus-visible:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 max-w-5xl mx-auto">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full h-10 px-6 font-bold"
          >
            All Shops
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full h-10 px-5 shadow-sm text-sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {loadingRealData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-52 w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedAndFilteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedAndFilteredBusinesses.map((business) => {
            let distance = null;
            if (userLocation && business.latitude && business.longitude) {
              distance = getDistanceFromLatLonInKm(
                userLocation.latitude,
                userLocation.longitude,
                business.latitude,
                business.longitude
              );
            }
            
            return (
              <div key={business.id} className="relative">
                {distance !== null && distance <= 1 && (
                  <div className="absolute -top-3 left-4 z-20">
                    <Badge className="bg-green-600 text-white border-none shadow-lg py-1 px-3">
                      <Navigation className="h-3 w-3 mr-1 fill-white" /> 1km Range
                    </Badge>
                  </div>
                )}
                <BusinessCard business={{ ...business, distance }} />
                {distance !== null && (
                  <div className="mt-2 flex items-center justify-end px-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {distance.toFixed(1)} KM AWAY
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/20 rounded-[2rem] border-4 border-dashed border-muted">
          <div className="max-w-md mx-auto space-y-4">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground opacity-30" />
            <h2 className="text-3xl font-black">No shops found here</h2>
            <p className="text-muted-foreground">Try searching for something else or change the category filter.</p>
            <Button variant="link" className="text-primary font-bold" onClick={() => {setSearchTerm(""); setSelectedCategory(null);}}>
              Clear all filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
