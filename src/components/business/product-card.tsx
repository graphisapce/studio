import Image from "next/image";
import type { Product } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, PhoneCall, Sparkles, Tag, TrendingUp, Zap } from "lucide-react";
import { Watermark } from "@/components/watermark";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
  shopWhatsApp?: string;
  shopName?: string;
  isPremium?: boolean;
}

export function ProductCard({ product, shopWhatsApp, shopName, isPremium = false }: ProductCardProps) {
  const displayImage = (typeof product?.imageUrl === 'string' && product.imageUrl.trim() !== "") 
    ? product.imageUrl 
    : `https://picsum.photos/seed/prod-${product?.id || 'default'}/400/300`;

  const handleAction = () => {
    if (!shopWhatsApp) return;
    
    if (isPremium) {
      // WhatsApp Order for Premium
      const message = encodeURIComponent(`Hi ${shopName}, I'm interested in buying your product "${product.title}" listed on LocalVyapar. Please share more details!`);
      window.open(`https://wa.me/${shopWhatsApp.replace(/\D/g, '')}?text=${message}`, '_blank');
    } else {
      // Direct Call for Free Users
      window.location.href = `tel:${shopWhatsApp.replace(/\D/g, '')}`;
    }
  };

  const renderBadge = () => {
    if (!product.badge) return null;
    switch (product.badge) {
      case 'best-seller': return <Badge className="bg-orange-500 hover:bg-orange-600 gap-1 absolute top-2 left-2 z-10"><TrendingUp className="h-3 w-3" /> Best Seller</Badge>;
      case 'new': return <Badge className="bg-blue-500 hover:bg-blue-600 gap-1 absolute top-2 left-2 z-10"><Sparkles className="h-3 w-3" /> New Arrival</Badge>;
      case 'limited': return <Badge className="bg-red-500 hover:bg-red-600 gap-1 absolute top-2 left-2 z-10"><Zap className="h-3 w-3" /> Limited</Badge>;
      case 'sale': return <Badge className="bg-green-500 hover:bg-green-600 gap-1 absolute top-2 left-2 z-10"><Tag className="h-3 w-3" /> Sale</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-primary/5 relative">
      <CardHeader className="p-0 relative">
        {renderBadge()}
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={displayImage}
            alt={product?.title || "Product"}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            data-ai-hint={product?.imageHint || "product"}
          />
           <Watermark />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-1">
          <CardTitle className="text-md font-bold leading-tight group-hover:text-primary transition-colors">{product?.title || "Unnamed Product"}</CardTitle>
          <p className="text-lg font-black text-primary">₹{(product?.price || 0).toFixed(0)}</p>
        </div>
        <CardDescription className="text-xs line-clamp-2 h-8">{product?.description || "No description provided."}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isPremium ? (
          <Button 
            onClick={handleAction}
            disabled={!shopWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 shadow-md group-hover:scale-[1.02] transition-transform"
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Buy on WhatsApp
          </Button>
        ) : (
          <Button 
            onClick={handleAction}
            disabled={!shopWhatsApp}
            variant="outline"
            className="w-full border-primary text-primary hover:bg-primary/5 font-bold h-10 shadow-sm"
          >
            <PhoneCall className="h-4 w-4 mr-2" /> Call to Order
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
