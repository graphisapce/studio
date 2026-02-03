"use client";

import { useState, useMemo } from "react";
import { collection } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { mockBusinesses } from "@/lib/data";
import type { Business, BusinessCategory } from "@/lib/types";
import { getDistanceFromLatLonInKm } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPinOff, LocateFixed } from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const categories: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 'Others'
];

export function BusinessGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const firestore = useFirestore();

  // Memoize the collection reference
  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: realBusinesses, isLoading: loadingRealData } = useCollection<Business>(businessesRef);

  // Location state
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
    // Combine real data and mock data (real data first)
    let businesses: Business[] = realBusinesses ? [...realBusinesses] : [];
    
    // Add mock data if needed or for initial state
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

    return businesses.filter((business) => {
      if (!business) return false;
      const shopName = business.shopName || "";
      const matchesCategory = !selectedCategory || business.category === selectedCategory;
      const matchesSearch = shopName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, userLocation, isDistanceFilterActive, realBusinesses, loadingRealData]);

  const toggleCategory = (category: BusinessCategory) => {
    setSelectedCategory(prev => (prev === category ? null : category));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-center text-navy dark:text-white">
          Discover Local Businesses
        </h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Find real local listings and original shops in your neighborhood.
        </p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for a shop or service..."
            className="pl-10 h-12 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {userLocation && (
            <Button
                variant={isDistanceFilterActive ? "secondary" : "outline"}
                onClick={() => setIsDistanceFilterActive(prev => !prev)}
                className="rounded-full"
              >
                {isDistanceFilterActive ? <MapPinOff className="mr-2 h-4 w-4"/> : <LocateFixed className="mr-2 h-4 w-4"/>}
                {isDistanceFilterActive ? 'Show All' : 'Nearby (5km)'}
            </Button>
           )}
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => toggleCategory(category)}
              className="rounded-full text-xs h-8"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {loadingRealData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBusinesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">No businesses found</h2>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
