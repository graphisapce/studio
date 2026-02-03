"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { doc, collection, query, where, increment, addDoc } from "firebase/firestore";
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Phone, MessageCircle, Loader2, Store, Lock, Crown, Eye, Share2, Star, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { ProductCard } from '@/components/business/product-card';
import { Watermark } from '@/components/watermark';
import type { Business, Product, Review } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { isBusinessPremium, isShopOpen } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const businessRef = useMemoFirebase(() => id ? doc(firestore, "businesses", id) : null, [firestore, id]);
  const { data: business, isLoading: loadingBusiness } = useDoc<Business>(businessRef);

  const productsQuery = useMemoFirebase(() => 
    id ? query(collection(firestore, "products"), where("businessId", "==", id)) : null, 
    [firestore, id]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  const reviewsQuery = useMemoFirebase(() => 
    id ? query(collection(firestore, "reviews"), where("businessId", "==", id)) : null, 
    [firestore, id]
  );
  const { data: reviews, isLoading: loadingReviews } = useCollection<Review>(reviewsQuery);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.shopName || 'LocalVyapar',
          text: `Check out ${business?.shopName} on LocalVyapar!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Share it with your friends!" });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Login Required", description: "Please login to leave a review." });
      return;
    }
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(firestore, "reviews"), {
        businessId: id,
        userId: user.uid,
        userName: userProfile.name,
        rating,
        comment,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setComment("");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not submit review." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loadingBusiness || loadingProducts || loadingReviews) {
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

  const shopBanner = (typeof business.imageUrl === 'string' && business.imageUrl.trim() !== "") 
    ? business.imageUrl 
    : `https://picsum.photos/seed/shop-banner-${business.id}/1200/400`;

  const shopLogo = (typeof business.logoUrl === 'string' && business.logoUrl.trim() !== "")
    ? business.logoUrl
    : `https://picsum.photos/seed/shop-logo-${business.id}/200/200`;
    
  const hasPremium = isBusinessPremium(business);
  const isOpen = isShopOpen(business);

  return (
    <div className="container mx-auto max-w-6xl pb-12 px-4">
      {/* Header Banner Section */}
      <header className="relative mb-20">
        <div className="relative h-48 md:h-72 w-full overflow-hidden rounded-b-2xl shadow-lg bg-muted">
          <Image
            src={shopBanner}
            alt={business.shopName || "Business Banner"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Watermark className="!text-white/90" />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button onClick={handleShare} size="icon" variant="secondary" className="rounded-full bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-md">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Floating Profile Info */}
        <div className="absolute -bottom-16 left-6 md:left-10 flex items-end gap-4 md:gap-6 w-[calc(100%-48px)]">
           <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl bg-background">
             <AvatarImage src={shopLogo} className="object-cover" />
             <AvatarFallback className="bg-primary/5 text-primary"><Store className="h-12 w-12" /></AvatarFallback>
           </Avatar>
           
           <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-black font-headline text-foreground drop-shadow-sm">
                  {business.shopName}
                </h1>
                {business.isVerified && <ShieldCheck className="h-6 w-6 text-blue-500" />}
                {hasPremium && (
                  <Badge className="bg-yellow-500 text-white border-none flex gap-1 items-center px-2 py-0.5">
                    <Crown className="h-3 w-3" /> Premium
                  </Badge>
                )}
                <Badge variant={isOpen ? "default" : "destructive"} className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" /> {isOpen ? "Open Now" : "Closed"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                  {business.category}
                </Badge>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {business.views || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {business.rating?.toFixed(1) || "5.0"}
                </span>
              </div>
           </div>
        </div>
      </header>

      <main className="mt-24 md:mt-28">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-sm border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{business.address}</p>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <Clock className="h-5 w-5 text-primary shrink-0" />
                  <span>{business.openingTime || "09:00"} AM - {business.closingTime || "09:00"} PM</span>
                </div>
                <p className="text-sm text-muted-foreground">{business.description || "No description provided."}</p>
                
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Button asChild className="w-full h-11 shadow-sm">
                    <a href={`tel:${business.contactNumber}`}>
                      <Phone className="mr-2 h-4 w-4" /> Call Shop
                    </a>
                  </Button>
                  
                  {hasPremium ? (
                    <Button asChild variant="outline" className="w-full h-11 border-green-500 text-green-600 hover:bg-green-50 font-bold">
                      <a href={business.whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Now
                      </a>
                    </Button>
                  ) : (
                    <div className="relative pt-2">
                      <Button variant="outline" className="w-full h-11 opacity-50 cursor-not-allowed border-gray-300 text-gray-400" disabled>
                        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp (Locked)
                      </Button>
                      <div className="absolute top-0 left-0 w-full text-center">
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground border flex items-center justify-center gap-1 mx-auto w-fit">
                           <Lock className="h-3 w-3" /> Upgrade to Premium for Direct Chat
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Customer Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmitReview} className="space-y-4 bg-muted/30 p-4 rounded-lg">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setRating(s)} className="transition-transform active:scale-90">
                        <Star className={`h-6 w-6 ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted opacity-30"}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea className="bg-background" placeholder="Write a short review..." value={comment} onChange={(e) => setComment(e.target.value)} required />
                  <Button type="submit" className="w-full" disabled={isSubmittingReview}>
                    {isSubmittingReview ? "Posting..." : "Post Review"}
                  </Button>
                </form>

                <div className="space-y-4 border-t pt-4 max-h-[400px] overflow-y-auto pr-2">
                  {reviews?.map((r) => (
                    <div key={r.id} className="space-y-1 p-3 rounded-lg border bg-card shadow-sm">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold">{r.userName}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">"{r.comment}"</p>
                    </div>
                  ))}
                  {(!reviews || reviews.length === 0) && <p className="text-xs text-muted-foreground text-center py-4">Be the first to review this shop!</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black font-headline flex items-center gap-3">
                Current Inventory
                <Badge variant="outline" className="rounded-full px-3">{approvedProducts.length} Items</Badge>
              </h2>
            </div>
            
            {approvedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {approvedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} shopWhatsApp={business.contactNumber} shopName={business.shopName} isPremium={hasPremium} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 border-4 border-dashed rounded-[2rem] bg-card/50 opacity-60">
                <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold">No products yet</h3>
                <p className="text-muted-foreground text-sm">This business hasn't listed any items for sale yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
