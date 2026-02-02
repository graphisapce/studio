"use client";

import { useState, useMemo } from "react";
import { mockBusinesses } from "@/lib/data";
import type { Business, BusinessCategory } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { BusinessCard } from "./business-card";
import { Skeleton } from "@/components/ui/skeleton";

const categories: BusinessCategory[] = ['Food', 'Services', 'Retail', 'Repairs'];

export function BusinessGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);

  const filteredBusinesses = useMemo(() => {
    return mockBusinesses.filter((business) => {
      const matchesCategory = !selectedCategory || business.category === selectedCategory;
      const matchesSearch = business.shopName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  const toggleCategory = (category: BusinessCategory) => {
    setSelectedCategory(prev => (prev === category ? null : category));
  };
  
  // To simulate loading state
  const [isLoading, setIsLoading] = useState(true);
  useState(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  });

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
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
