
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection, query, limit, getDocs } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { mockBusinesses } from "@/lib/data";
import type { Business, BusinessCategory, PlatformConfig, Product } from "@/lib/types";
import { getDistanceFromLatLonInKm, isBusinessPremium } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  MapPin, 
  Navigation, 
  Star, 
  ShieldCheck, 
  Megaphone, 
  Utensils, 
  Zap, 
  ShoppingCart, 
  Wrench, 
  Info,
  Scale,
  Hammer,
  Bike,
  Car,
  Brush,
  Laptop,
  HeartPulse,
  GraduationCap,
  Gift,
  Sofa,
  Shirt,
  Gem,
  Pill,
  Book,
  Scissors,
  Flame,
  LayoutGrid,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const categoriesData: { name: BusinessCategory, icon: any }[] = [
  { name: 'Food', icon: Utensils },
  { name: 'Groceries', icon: ShoppingCart },
  { name: 'Advocate', icon: Scale },
  { name: 'Bike Repair', icon: Bike },
  { name: 'Car Repair', icon: Car },
  { name: 'Loha Welding', icon: Hammer },
  { name: 'Car Painter', icon: Brush },
  { name: 'Electronics', icon: Laptop },
  { name: 'Repairs', icon: Wrench },
  { name: 'Services', icon: LayoutGrid },
  { name: 'Beauty', icon: Scissors },
  { name: 'Health', icon: HeartPulse },
  { name: 'Education', icon: GraduationCap },
  { name: 'Automobile', icon: Car },
  { name: 'Gifts', icon: Gift },
  { name: 'Home Decor', icon: Sofa },
  { name: 'Clothing', icon: Shirt },
  { name: 'Jewelry', icon: Gem },
  { name: 'Hardware', icon: Hammer },
  { name: 'Pharmacy', icon: Pill },
  { name: 'Stationery', icon: Book },
  { name: 'Bike Seat Cover', icon: Bike },
  { name: 'Retail', icon: ShoppingCart },
  { name: 'Others', icon: Info },
];

interface BusinessGridProps {
  externalCategory?: BusinessCategory | null;
  externalSearch?: string;
}

export function BusinessGrid({ externalCategory, externalSearch }: BusinessGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const firestore = useFirestore();

  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: realBusinesses, isLoading: loadingRealData } = useCollection<Business>(businessesRef);

  const productsRef = useMemoFirebase(() => collection(firestore, "products"), [firestore]);
  const { data: allProducts, isLoading: loadingProducts } = useCollection<Product>(productsRef);

  useEffect(() => {
    if (externalCategory !== undefined) setSelectedCategory(externalCategory);
    if (externalSearch !== undefined) setSearchTerm(externalSearch);
  }, [externalCategory, externalSearch]);

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

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.warn("Location denied:", error.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const liveDeals = useMemo(() => {
    if (!realBusinesses || !userLocation) return [];
    return realBusinesses.filter(b => {
      if (!b.flashDeal || !b.latitude || !b.longitude) return false;
      const dist = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
      return dist <= 1;
    });
  }, [realBusinesses, userLocation]);

  const sortedAndFilteredBusinesses = useMemo(() => {
    let businesses: Business[] = realBusinesses ? [...realBusinesses] : [];
    if (businesses.length === 0 && !loadingRealData) businesses = [...mockBusinesses];

    const businessIdsWithMatchingProducts = new Set<string>();
    if (searchTerm.trim() !== "" && allProducts) {
      allProducts.forEach(p => {
        if (p.status === 'approved' && p.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          businessIdsWithMatchingProducts.add(p.businessId);
        }
      });
    }

    let filtered = businesses.filter((business) => {
      if (!business) return false;
      const shopName = business.shopName || "";
      const matchesCategory = !selectedCategory || business.category === selectedCategory;
      const matchesSearch = shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (business.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           businessIdsWithMatchingProducts.has(business.id);
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
        
        if (distA <= 1 && distB > 1) return -1;
        if (distB <= 1 && distA > 1) return 1;
        return distA - distB;
      }
      return (b.views || 0) - (a.views || 0);
    });

    return filtered;
  }, [searchTerm, selectedCategory, userLocation, realBusinesses, loadingRealData, allProducts]);

  const mainCategories = categoriesData.slice(0, 6);
  const remainingCategories = categoriesData.slice(6);

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      {/* Live Flash Deals Ticker */}
      {liveDeals.length > 0 && (
        <div className="bg-yellow-400 text-black py-2 px-4 rounded-full mb-8 flex items-center overflow-hidden whitespace-nowrap shadow-lg">
           <Zap className="h-4 w-4 mr-3 animate-pulse fill-black" />
           <div className="animate-marquee inline-block flex gap-12">
             {liveDeals.map(b => (
               <span key={b.id} className="font-black text-xs uppercase">
                 <span className="bg-black text-white px-2 py-0.5 rounded mr-2">{b.shopName}</span>
                 {b.flashDeal}
               </span>
             ))}
           </div>
        </div>
      )}

      {platformConfig?.announcement && (
        <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl mb-8 flex items-center gap-3 animate-pulse">
          <Megaphone className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs font-bold text-primary">{platformConfig.announcement}</p>
        </div>
      )}

      <div className="mb-10 space-y-8">
        <div className="text-center space-y-4">
           <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight">
             Market <span className="text-primary">Ab Aapke Haath</span> Mein
           </h1>
           <p className="text-muted-foreground max-w-xl mx-auto text-lg">
             Dhoondein shops, products aur services apne pados mein.
           </p>
        </div>

        <div className="relative max-w-2xl mx-auto px-4">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Input
            placeholder="Search Shops or Products (e.g. Pizza, Advocate, Repair)"
            className="pl-14 h-16 text-lg rounded-2xl shadow-xl border-2 border-primary/10 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories Explorer Section */}
        <div className="space-y-6 mt-12 max-w-4xl mx-auto">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black font-headline">Explore Categories</h2>
            {selectedCategory && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-primary font-bold">
                Clear Filter
              </Button>
            )}
          </div>
          
          <Collapsible open={isCategoriesExpanded} onOpenChange={setIsCategoriesExpanded} className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 px-2">
              {mainCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 group ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg scale-105' 
                        : 'bg-white border hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-3 rounded-full transition-colors ${
                      isActive ? 'bg-white/20' : 'bg-primary/5 text-primary group-hover:bg-primary/10'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`text-[10px] font-bold text-center uppercase tracking-tight line-clamp-1 ${
                      isActive ? 'text-white' : 'text-muted-foreground'
                    }`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 px-2">
                {remainingCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 group ${
                        isActive 
                          ? 'bg-primary text-white shadow-lg scale-105' 
                          : 'bg-white border hover:border-primary/50 hover:shadow-md'
                      }`}
                    >
                      <div className={`p-3 rounded-full transition-colors ${
                        isActive ? 'bg-white/20' : 'bg-primary/5 text-primary group-hover:bg-primary/10'
                      }`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={`text-[10px] font-bold text-center uppercase tracking-tight line-clamp-1 ${
                        isActive ? 'text-white' : 'text-muted-foreground'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>

            <div className="flex justify-center mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-2 border-primary/20 text-muted-foreground hover:text-primary transition-colors">
                  {isCategoriesExpanded ? (
                    <>Show Less <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>See All Categories <ChevronDown className="h-4 w-4" /></>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </Collapsible>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black font-headline">
          {selectedCategory ? `${selectedCategory} Shops` : "Nearby Shops"}
        </h2>
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Navigation className="h-3 w-3" /> Jahangirpuri, Delhi
        </div>
      </div>

      {loadingRealData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-52 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedAndFilteredBusinesses.length > 0 ? (
            sortedAndFilteredBusinesses.map((business) => {
              let distance = null;
              if (userLocation && business.latitude && business.longitude) {
                distance = getDistanceFromLatLonInKm(userLocation.latitude, userLocation.longitude, business.latitude, business.longitude);
              }
              return <BusinessCard key={business.id} business={{ ...business, distance }} />;
            })
          ) : (
            <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed rounded-3xl">
              <Info className="h-12 w-12 mx-auto mb-4" />
              <p className="font-bold">No shops found in this category.</p>
              <Button variant="link" onClick={() => setSelectedCategory(null)}>View all shops</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
