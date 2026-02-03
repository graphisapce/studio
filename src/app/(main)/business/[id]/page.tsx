"use client";

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { doc, collection, query, where, increment } from "firebase/firestore";
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Phone, MessageCircle, Loader2, Store, Lock, Crown, Eye } from 'lucide-react';
import { ProductCard } from '@/components/business/product-card';
import { Watermark } from '@/components/watermark';
import type { Business, Product } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { isBusinessPremium } from '@/lib/utils';

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const businessRef = useMemoFirebase(() => id ? doc(firestore, "businesses", id) : null, [firestore, id]);
  const { data: business, isLoading: loadingBusiness } = useDoc<Business>(businessRef);

  const productsQuery = useMemoFirebase(() => 
    id ? query(collection(firestore, "products"), where("businessId", "==", id)) : null, 
    [firestore, id]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  // Increment view count on mount
  useEffect(() => {
    if (id && firestore) {
      const docRef = doc(firestore, "businesses", id);
      updateDocumentNonBlocking(docRef, {
        views: increment(1)
      });
    }
  }, [id, firestore]);

  const approvedProducts = useMemo(() => {
    return products?.filter(p => p.status === 'approved') || [];
  }, [products]);

  if (loadingBusiness || loadingProducts) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto py-20 text-center">
        <Store className="mx-auto h-16 w-16 text-muted-foreground opacity-20 mb-4" />
        <h1 className="text-2xl font-bold">Business not found</h1>
        <p className="text-muted-foreground">The shop you are looking for does not exist.</p>
        <Button className="mt-4" asChild><a href="/">Back to Home</a></Button>
      </div>
    );
  }

  const shopImage = (typeof business.imageUrl === 'string' && business.imageUrl.trim() !== "") 
    ? business.imageUrl 
    : `https://picsum.photos/seed/shop-${business.id}/800/400`;
    
  const hasPremium = isBusinessPremium(business);

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <header className="mb-8">
        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg shadow-lg bg-muted">
          <Image
            src={shopImage}
            alt={business.shopName}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           <Watermark className="!text-white/90" />
          <div className="absolute bottom-0 left-0 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl md:text-5xl font-bold text-white font-headline">
                {business.shopName}
              </h1>
              {hasPremium && (
                <Badge className="bg-yellow-500 text-white border-none flex gap-1 items-center">
                  <Crown className="h-3 w-3" /> Premium
                </Badge>
              )}
            </div>
            <p className="text-lg text-white/90 mt-1 flex items-center gap-2">
              {business.address}
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded flex items-center gap-1">
                <Eye className="h-3 w-3" /> {business.views || 0} views
              </span>
            </p>
          </div>
        </div>
      </header>

      <main>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Business Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{business.description || "No description provided."}</p>
                <div className="flex flex-col gap-3 pt-4">
                  <Button asChild className="w-full">
                    <a href={`tel:${business.contactNumber}`}>
                      <Phone className="mr-2 h-4 w-4" /> Call Now
                    </a>
                  </Button>
                  
                  {hasPremium ? (
                    <Button asChild variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50">
                      <a href={business.whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                      </a>
                    </Button>
                  ) : (
                    <div className="relative pt-4">
                      <Button variant="outline" className="w-full opacity-50 cursor-not-allowed border-gray-300 text-gray-400" disabled>
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp (Locked)
                      </Button>
                      <div className="absolute top-0 left-0 w-full text-center">
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground flex items-center justify-center gap-1">
                           <Lock className="h-3 w-3" /> Premium Feature
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-6 font-headline flex items-center gap-2">
              Products & Services
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{approvedProducts.length}</span>
            </h2>
            {approvedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {approvedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card/50">
                <p className="text-muted-foreground">No approved products listed yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
