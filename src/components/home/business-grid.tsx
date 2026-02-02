
"use client";

import { useState, useMemo, useEffect } from "react";
import { db } from "@/lib/firebase/clientApp";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { mockBusinesses } from "@/lib/data";
import type { Business, BusinessCategory, UserProfile } from "@/lib/types";
import { getDistanceFromLatLonInKm } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPinOff, LocateFixed, Loader2 } from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";

const categories: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 'Others'
];

export function BusinessGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [realBusinesses, setRealBusinesses] = useState<Business[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(true);

  // Location state
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isDistanceFilterActive, setIsDistanceFilterActive] = useState(false);

  useEffect(() => {
    // Fetch real businesses from Firestore
    const q = query(collection(db, "users"), where("role", "==", "business"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const businesses: Business[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        if (data.shopName) {
          businesses.push({
            id: data.uid,
            ownerId: data.uid,
            shopName: data.shopName,
            category: data.shopCategory || 'Others',
            address: data.shopAddress || 'Address not set',
            contactNumber: data.shopContact || '',
            whatsappLink: data.shopContact ? `https://wa.me/${data.shopContact}` : '',
            imageUrl: (data.shopImageUrls && data.shopImageUrls.length > 0) ? data.shopImageUrls[0] : 'https://picsum.photos/seed/shop/600/400',
            imageHint: 'shop',
            latitude: 0,
            longitude: 0
          });
        }
      });
      setRealBusinesses(businesses);
      setLoadingRealData(false);
    });

    // Fetch geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      );
    }

    return () => unsubscribe();
  }, []);

  const filteredBusinesses = useMemo(() => {
    // Combine real data and mock data (real data first)
    let businesses = [...realBusinesses, ...mockBusinesses];

    if (userLocation && isDistanceFilterActive) {
      businesses = businesses.filter((business) => {
        if (!business.latitude || !business.longitude) return false;
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
      const matchesCategory = !selectedCategory || business.category === selectedCategory;
      const matchesSearch = business.shopName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, userLocation, isDistanceFilterActive, realBusinesses]);

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
