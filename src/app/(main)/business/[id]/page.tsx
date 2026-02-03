
"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { doc, collection, query, where, increment, addDoc } from "firebase/firestore";
import { useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Phone, 
  MessageCircle, 
  Loader2, 
  Store, 
  Lock, 
  Crown, 
  Eye, 
  Share2, 
  Star, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CreditCard, 
  Zap,
  Instagram,
  Facebook,
  QrCode
} from 'lucide-react';
import { ProductCard } from '@/components/business/product-card';
import { Watermark } from '@/components/watermark';
import type { Business, Product, Review } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { isBusinessPremium, isShopOpen } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  useEffect(() => {
    if (id && firestore) {
      const docRef = doc(firestore, "businesses", id);
      updateDocumentNonBlocking(docRef, { views: increment(1) });
    }
  }, [id, firestore]);

  const approvedProducts = useMemo(() => products?.filter(p => p.status === 'approved') || [], [products]);

  const handleShare = async () => {
    const shareData = {
      title: business?.shopName || 'LocalVyapar',
      text: `Check out ${business?.shopName} on LocalVyapar! Best deals nearby.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ 
          title: "Link Copied",
          description: "Shop link has been copied to your clipboard." 
        });
      }
    } catch (err) {
      // Fallback for user cancel or desktop browsers
      await navigator.clipboard.writeText(window.location.href);
      toast({ 
        title: "Link Copied",
        description: "Shop link has been copied to your clipboard." 
      });
    }
  };

  const handlePayUPI = () => {
    if (!business?.upiId) return;
    const upiUrl = `upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.shopName)}&cu=INR`;
    window.open(upiUrl, '_blank');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Login Required" });
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
      toast({ title: "Review Submitted" });
      setComment("");
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    } finally { setIsSubmittingReview(false); }
  };

  if (loadingBusiness || loadingProducts || loadingReviews) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!business) return <div className="text-center py-20">Business not found</div>;

  const hasPremium = isBusinessPremium(business);
  const isOpen = isShopOpen(business);

  return (
    <div className="container mx-auto max-w-6xl pb-12 px-4">
      <header className="relative mb-20">
        <div className="relative h-48 md:h-72 w-full overflow-hidden rounded-b-2xl shadow-lg bg-muted">
          <Image src={business.imageUrl || `https://picsum.photos/seed/${business.id}/1200/400`} alt={business.shopName} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Watermark className="!text-white/90" />
          <div className="absolute top-4 right-4 z-20">
            <Button onClick={handleShare} size="icon" variant="secondary" className="rounded-full shadow-lg border-2 border-white/20">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="absolute -bottom-16 left-6 flex items-end gap-4 w-[calc(100%-48px)]">
           <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl bg-white">
             <AvatarImage src={business.logoUrl} className="object-cover" />
             <AvatarFallback className="bg-primary/5 text-primary"><Store className="h-12 w-12" /></AvatarFallback>
           </Avatar>
           <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-black font-headline">{business.shopName}</h1>
                {business.isVerified && <ShieldCheck className="h-6 w-6 text-blue-500" />}
                {hasPremium && <Badge className="bg-yellow-500"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                <Badge variant="secondary">{business.category}</Badge>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {business.views || 0} views</span>
                <div className="flex gap-2 ml-2">
                  {business.instagramUrl && (
                    <a href={business.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-muted rounded-full transition-colors">
                      <Instagram className="h-4 w-4 text-pink-600" />
                    </a>
                  )}
                  {business.facebookUrl && (
                    <a href={business.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-muted rounded-full transition-colors">
                      <Facebook className="h-4 w-4 text-blue-600" />
                    </a>
                  )}
                </div>
              </div>
           </div>
        </div>
      </header>

      <main className="mt-24">
        {business.flashDeal && (
          <div className="bg-yellow-100 border-2 border-yellow-400 p-4 rounded-xl mb-8 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-3">
               <Zap className="h-6 w-6 text-yellow-600 animate-bounce" />
               <p className="font-bold text-yellow-800 tracking-tight">{business.flashDeal}</p>
             </div>
             <Badge className="bg-yellow-600">Live Offer</Badge>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-sm border-primary/10">
              <CardHeader><CardTitle className="text-lg">Shop Contact</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-primary" /><p className="text-sm">{business.address}</p></div>
                <div className="flex items-center gap-3 text-sm font-bold"><Clock className="h-5 w-5 text-primary" /><span>{isOpen ? "Open Now" : "Closed"} • {business.openingTime} - {business.closingTime}</span></div>
                
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Button asChild className="w-full h-11"><a href={`tel:${business.contactNumber}`}><Phone className="mr-2 h-4 w-4" /> Call Shop</a></Button>
                  
                  {hasPremium && (business.upiId || business.paymentQrUrl) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 shadow-md">
                          <CreditCard className="mr-2 h-4 w-4" /> Pay via UPI/QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xs text-center">
                        <DialogHeader>
                          <DialogTitle>Make Payment</DialogTitle>
                          <DialogDescription>Pay directly to the shop owner.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          {business.paymentQrUrl ? (
                            <div className="relative w-full aspect-square border-2 border-dashed rounded-xl overflow-hidden bg-white">
                              <Image src={business.paymentQrUrl} alt="Payment QR" fill className="object-contain p-2" />
                            </div>
                          ) : (
                            <div className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20">
                              <QrCode className="h-12 w-12 text-muted-foreground mb-2" />
                              <p className="text-xs text-muted-foreground">QR not uploaded by shop</p>
                            </div>
                          )}
                          {business.upiId && (
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-muted-foreground uppercase bg-muted/50 py-1 rounded">UPI ID: {business.upiId}</p>
                              <Button onClick={handlePayUPI} className="w-full h-12 bg-primary">
                                Pay to UPI ID
                              </Button>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {hasPremium ? (
                    <Button asChild variant="outline" className="w-full h-11 border-green-500 text-green-600 hover:bg-green-50"><a href={business.whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Now</a></Button>
                  ) : (
                    <div className="relative pt-2"><Button variant="outline" className="w-full h-11 opacity-50" disabled><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp (Locked)</Button></div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> Reviews</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmitReview} className="space-y-4 bg-muted/30 p-4 rounded-lg">
                  <div className="flex gap-1">{[1, 2, 3, 4, 5].map((s) => (<button key={s} type="button" onClick={() => setRating(s)}><Star className={`h-6 w-6 ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted opacity-30"}`} /></button>))}</div>
                  <Textarea placeholder="Write a review..." value={comment} onChange={(e) => setComment(e.target.value)} required />
                  <Button type="submit" className="w-full" disabled={isSubmittingReview}>Post Review</Button>
                </form>
                <div className="space-y-4 border-t pt-4">
                  {reviews?.map((r) => (
                    <div key={r.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex justify-between items-center"><p className="text-sm font-bold">{r.userName}</p><div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => (<Star key={i} className="h-2 w-2 text-yellow-500 fill-yellow-500" />))}</div></div>
                      <p className="text-xs text-muted-foreground italic mt-1">"{r.comment}"</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-2xl font-black font-headline mb-6">Store Inventory</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {approvedProducts.length > 0 ? (
                approvedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} shopWhatsApp={business.contactNumber} shopName={business.shopName} isPremium={hasPremium} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center opacity-50 border-2 border-dashed rounded-xl">
                  No products available for now.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
