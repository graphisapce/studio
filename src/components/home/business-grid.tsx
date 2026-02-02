"use client";

import { useState, useMemo, useEffect } from "react";
import { mockBusinesses } from "@/lib/data";
import type { Business, BusinessCategory } from "@/lib/types";
import { getDistanceFromLatLonInKm } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPinOff, LocateFixed } from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const categories: BusinessCategory[] = ['Food', 'Services', 'Retail', 'Repairs'];

export function BusinessGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);

  // Location state
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isDistanceFilterActive, setIsDistanceFilterActive] = useState(true);

  // Initial loading simulation state
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initial content load
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);

    // Fetch geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocationLoading(false);
          setLocationError(null);
        },
        (error) => {
          setLocationError("Location permission denied. Showing all businesses.");
          setIsLocationLoading(false);
          setIsDistanceFilterActive(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported. Showing all businesses.");
      setIsLocationLoading(false);
      setIsDistanceFilterActive(false);
    }

    return () => clearTimeout(timer);
  }, []);

  const filteredBusinesses = useMemo(() => {
    let businesses = mockBusinesses;

    if (userLocation && isDistanceFilterActive) {
      businesses = businesses.filter((business) => {
        if (!business.latitude || !business.longitude) return false;
        const distance = getDistanceFromLatLonInKm(
          userLocation.latitude,
          userLocation.longitude,
          business.latitude,
          business.longitude
        );
        return distance <= 1; // 1 km radius
      });
    }

    return businesses.filter((business) => {
      const matchesCategory = !selectedCategory || business.category === selectedCategory;
      const matchesSearch = business.shopName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, userLocation, isDistanceFilterActive]);

  const toggleCategory = (category: BusinessCategory) => {
    setSelectedCategory(prev => (prev === category ? null : category));
  };

  const isLoading = isInitialLoading || isLocationLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-center text-navy dark:text-white">
          Discover Local Businesses
        </h1>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          From street food to mobile repairs, find everything you need right in your neighborhood.
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
        <div className="flex flex-wrap items-center justify-center gap-2">
          {userLocation && (
            <Button
                variant={isDistanceFilterActive ? "secondary" : "outline"}
                onClick={() => setIsDistanceFilterActive(prev => !prev)}
                className="rounded-full"
              >
                {isDistanceFilterActive ? <MapPinOff className="mr-2 h-4 w-4"/> : <LocateFixed className="mr-2 h-4 w-4"/>}
                {isDistanceFilterActive ? 'Show All' : 'Nearby (1km)'}
            </Button>
           )}
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => toggleCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {locationError && !isLocationLoading && (
        <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
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
          <p className="text-muted-foreground">
            {isDistanceFilterActive && userLocation 
              ? "No businesses found within 1km. Try showing all businesses." 
              : "Try adjusting your search or filters."
            }
          </p>
        </div>
      )}
    </div>
  );
}
