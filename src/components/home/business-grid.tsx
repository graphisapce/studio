
"use client";

import { useState, useMemo, useEffect } from "react";
import { collection } from "firebase/firestore";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Business, BusinessCategory, Product } from "@/lib/types";
import { getDistanceFromLatLonInKm, isBusinessPremium } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, Navigation, Utensils, ShoppingCart, Wrench, Info, Scale, Hammer, Bike, Car, Brush, Laptop, HeartPulse, GraduationCap, Gift, Sofa, Shirt, Gem, Pill, Book, Scissors, LayoutGrid, ChevronDown, ChevronUp, MapPin, Store
} from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const categoriesData: { name: BusinessCategory, icon: any }[] = [
  { name: 'Food', icon: Utensils }, { name: 'Groceries', icon: ShoppingCart }, { name: 'Advocate', icon: Scale }, { name: 'Bike Repair', icon: Bike }, { name: 'Car Repair', icon: Car }, { name: 'Loha Welding', icon: Hammer }, { name: 'Car Painter', icon: Brush }, { name: 'Electronics', icon: Laptop }, { name: 'Repairs', icon: Wrench }, { name: 'Services', icon: LayoutGrid }, { name: 'Beauty', icon: Scissors }, { name: 'Health', icon: HeartPulse }, { name: 'Education', icon: GraduationCap }, { name: 'Automobile', icon: Car }, { name: 'Gifts', icon: Gift }, { name: 'Home Decor', icon: Sofa }, { name: 'Clothing', icon: Shirt }, { name: 'Jewelry', icon: Gem }, { name: 'Hardware', icon: Hammer }, { name: 'Pharmacy', icon: Pill }, { name: 'Stationery', icon: Book }, { name: 'Bike Seat Cover', icon: Bike }, { name: 'Retail', icon: ShoppingCart }, { name: 'Others', icon: Info },
];

export function BusinessGrid({ externalCategory, externalSearch }: { externalCategory?: any, externalSearch?: string }) {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);
  const [isMyAreaOnly, setIsMyAreaOnly] = useState(false);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number, lon: number } | null>(null);
  const firestore = useFirestore();

  const businessesRef = useMemoFirebase(() => collection(firestore, "businesses"), [firestore]);
  const { data: realBusinesses, isLoading: loadingRealData } = useCollection<Business>(businessesRef);
  
  const productsRef = useMemoFirebase(() => collection(firestore, "products"), [firestore]);
  const { data: allProducts } = useCollection<Product>(productsRef);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location access denied.");
        }
      );
    }
  }, []);

  useEffect(() => {
    if (externalCategory) setSelectedCategory(externalCategory);
    if (externalSearch) setSearchTerm(externalSearch);
  }, [externalCategory, externalSearch]);

  const sortedAndFilteredBusinesses = useMemo(() => {
    if (!realBusinesses) return [];

    let list: (Business & { distance?: number })[] = realBusinesses.map(b => {
      let distance: number | undefined = undefined;
      if (userCoords && b.latitude && b.longitude) {
        distance = getDistanceFromLatLonInKm(userCoords.lat, userCoords.lon, b.latitude, b.longitude);
      }
      return { ...b, distance };
    });

    const matchesSearch = (b: Business) => {
      if (!searchTerm.trim()) return true;
      const s = searchTerm.toLowerCase();
      const matchName = (b.shopName || "").toLowerCase().includes(s);
      const matchCat = (b.category || "").toLowerCase().includes(s);
      const matchProd = allProducts?.some(p => 
        p.businessId === b.id && 
        p.status === 'approved' && 
        ((p.title || "").toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s))
      );
      return matchName || matchCat || matchProd;
    };

    return list.filter(b => {
      // Robust filter: Don't show shops with no name (incomplete)
      if (!b.shopName) return false;

      const matchesCat = !selectedCategory || b.category === selectedCategory;
      const matchesArea = !isMyAreaOnly || !userProfile?.areaCode || b.areaCode === userProfile.areaCode;
      return matchesCat && matchesArea && matchesSearch(b);
    }).sort((a, b) => {
      // 1. Premium Priority
      const aPrem = isBusinessPremium(a);
      const bPrem = isBusinessPremium(b);
      if (aPrem && !bPrem) return -1;
      if (!aPrem && bPrem) return 1;

      // 2. Proximity Priority
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;

      return 0;
    });
  }, [searchTerm, selectedCategory, isMyAreaOnly, realBusinesses, allProducts, userProfile, userCoords]);

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="mb-10 space-y-8">
        <div className="text-center space-y-4">
           <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight">Market <span className="text-primary">Ab Aapke Haath</span> Mein</h1>
           <p className="text-muted-foreground max-w-xl mx-auto text-lg">Dhoondein shops, products aur services apne pados mein.</p>
           {userCoords && (
             <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 gap-1 py-1 px-3">
               <Navigation className="h-3 w-3 animate-pulse" /> Location Active: Showing Nearest Shops
             </Badge>
           )}
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
            <Input placeholder="Search Shops or Products..." className="pl-12 h-16 text-lg rounded-2xl shadow-xl border-2 border-primary/10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex items-center justify-between px-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
             <div className="flex items-center gap-2">
               <MapPin className="h-4 w-4 text-primary" />
               <Label htmlFor="area-toggle" className="text-xs font-black uppercase">My Area Only ({userProfile?.areaCode || 'Global'})</Label>
             </div>
             <Switch id="area-toggle" checked={isMyAreaOnly} onCheckedChange={setIsMyAreaOnly} />
          </div>
        </div>

        <div className="space-y-6 mt-12 max-w-4xl mx-auto">
          <h2 className="text-xl font-black font-headline px-2">Explore Categories</h2>
          <Collapsible open={isCategoriesExpanded} onOpenChange={setIsCategoriesExpanded} className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 px-2">
              {categoriesData.slice(0, 6).map((cat) => (
                <button key={cat.name} onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${selectedCategory === cat.name ? 'bg-primary text-white scale-105' : 'bg-white hover:border-primary/50'}`}>
                  <cat.icon className="h-6 w-6" /><span className="text-[10px] font-bold uppercase">{cat.name}</span>
                </button>
              ))}
            </div>
            <CollapsibleContent className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 px-2">
              {categoriesData.slice(6).map((cat) => (
                <button key={cat.name} onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${selectedCategory === cat.name ? 'bg-primary text-white scale-105' : 'bg-white hover:border-primary/50'}`}>
                  <cat.icon className="h-6 w-6" /><span className="text-[10px] font-bold uppercase">{cat.name}</span>
                </button>
              ))}
            </CollapsibleContent>
            <div className="flex justify-center"><CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="rounded-full gap-2 font-bold">{isCategoriesExpanded ? <>Show Less <ChevronUp /></> : <>See All <ChevronDown /></>}</Button></CollapsibleTrigger></div>
          </Collapsible>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loadingRealData ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />) : 
          sortedAndFilteredBusinesses.length > 0 ? (
            sortedAndFilteredBusinesses.map((b) => <BusinessCard key={b.id} business={b} />)
          ) : (
            <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed rounded-[2rem]">
               <Store className="h-16 w-16 mx-auto mb-4" />
               <p className="font-bold text-lg">No shops found in this area/category.</p>
            </div>
          )
        }
      </div>
    </div>
  );
}
