
"use client";

import Image from "next/image";
import type { Product, Order } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, PhoneCall, Sparkles, Tag, TrendingUp, Zap, Truck, Loader2 } from "lucide-react";
import { Watermark } from "@/components/watermark";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  shopWhatsApp?: string;
  shopName?: string;
  shopAddress?: string;
  isPremium?: boolean;
}

export function ProductCard({ product, shopWhatsApp, shopName, shopAddress, isPremium = false }: ProductCardProps) {
  const { user, userProfile } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOrdering, setIsOrdering] = useState(false);

  const displayImage = (typeof product?.imageUrl === 'string' && product.imageUrl.trim() !== "") 
    ? product.imageUrl 
    : `https://picsum.photos/seed/prod-${product?.id || 'default'}/400/300`;

  const handleAction = () => {
    if (!shopWhatsApp) return;
    const message = encodeURIComponent(`Hi ${shopName}, I'm interested in "${product.title}" on LocalVyapar.`);
    window.open(`https://wa.me/${shopWhatsApp.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleRequestDelivery = async () => {
    if (!user || !userProfile) {
      toast({ variant: "destructive", title: "Login Required", description: "Order karne ke liye login karein." });
      return;
    }

    if (!userProfile.deliveryId || !userProfile.houseNo) {
      toast({ variant: "destructive", title: "Profile Incomplete", description: "Pehle Dashboard mein delivery address aur ID set karein." });
      return;
    }

    if (!userProfile.phone) {
      toast({ variant: "destructive", title: "Phone Missing", description: "Pehle Dashboard mein apna phone number save karein." });
      return;
    }

    setIsOrdering(true);
    try {
      const addressString = `${userProfile.houseNo}, ${userProfile.street}, ${userProfile.landmark || ''}, ${userProfile.city}, ${userProfile.state} - ${userProfile.pincode}`;
      
      const custId = userProfile.deliveryId;
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const displayOrderId = `ORD-${custId}-${randomNum}`;

      // Use the provided shopAddress or fallback to a placeholder if it's missing
      const finalShopAddress = shopAddress || "Address not provided by shop owner";

      await addDocumentNonBlocking(collection(firestore, "orders"), {
        displayOrderId: displayOrderId,
        customerId: user.uid,
        customerName: userProfile.name,
        customerDeliveryId: userProfile.deliveryId,
        customerPhone: userProfile.phone,
        businessId: product.businessId,
        shopName: shopName || "Local Shop",
        shopPhone: shopWhatsApp || "",
        shopAddress: finalShopAddress,
        productId: product.id,
        productTitle: product.title,
        price: product.price,
        status: "pending",
        address: addressString,
        createdAt: new Date().toISOString()
      });

      toast({ 
        title: "Delivery Requested! 🚚", 
        description: `Order ID: ${displayOrderId}. Rider address: ${finalShopAddress}` 
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Order request fail ho gayi." });
    } finally {
      setIsOrdering(false);
    }
  };

  const renderBadge = () => {
    if (!product.badge) return null;
    const badges = {
      'best-seller': { color: 'bg-orange-500', icon: TrendingUp, text: 'Best Seller' },
      'new': { color: 'bg-blue-500', icon: Sparkles, text: 'New' },
      'limited': { color: 'bg-red-500', icon: Zap, text: 'Limited' },
      'sale': { color: 'bg-green-500', icon: Tag, text: 'Sale' }
    };
    const b = badges[product.badge];
    if (!b) return null;
    const Icon = b.icon;
    return <Badge className={`${b.color} gap-1 absolute top-2 left-2 z-10`}><Icon className="h-3 w-3" /> {b.text}</Badge>;
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/5 relative">
      <CardHeader className="p-0 relative">
        {renderBadge()}
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image src={displayImage} alt={product?.title || "Product"} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
           <Watermark />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-1">
          <CardTitle className="text-md font-bold truncate">{product?.title || "Product"}</CardTitle>
          <p className="text-lg font-black text-primary">₹{product?.price || 0}</p>
        </div>
        <CardDescription className="text-xs line-clamp-2 h-8">{product?.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        <Button onClick={handleRequestDelivery} disabled={isOrdering} className="w-full bg-orange-500 hover:bg-orange-600 font-bold gap-2 h-11">
          {isOrdering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          Request Delivery
        </Button>
        <Button onClick={handleAction} variant="outline" className="w-full border-primary text-primary font-bold h-11">
          <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp Buy
        </Button>
      </CardFooter>
    </Card>
  );
}
