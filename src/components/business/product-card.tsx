import Image from "next/image";
import type { Product, Business } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Watermark } from "@/components/watermark";

interface ProductCardProps {
  product: Product;
  shopWhatsApp?: string;
  shopName?: string;
}

export function ProductCard({ product, shopWhatsApp, shopName }: ProductCardProps) {
  const displayImage = (typeof product?.imageUrl === 'string' && product.imageUrl.trim() !== "") 
    ? product.imageUrl 
    : `https://picsum.photos/seed/prod-${product?.id || 'default'}/400/300`;

  const handleOrder = () => {
    if (!shopWhatsApp) return;
    const message = encodeURIComponent(`Hi ${shopName}, I'm interested in buying your product "${product.title}" listed on LocalVyapar. Please share more details!`);
    window.open(`https://wa.me/${shopWhatsApp.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow border-primary/5">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={displayImage}
            alt={product?.title || "Product"}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            data-ai-hint={product?.imageHint || "product"}
          />
           <Watermark />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-1">
          <CardTitle className="text-md font-bold leading-tight">{product?.title || "Unnamed Product"}</CardTitle>
          <p className="text-lg font-black text-primary">₹{(product?.price || 0).toFixed(0)}</p>
        </div>
        <CardDescription className="text-xs line-clamp-2">{product?.description || "No description provided."}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleOrder}
          disabled={!shopWhatsApp}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 shadow-sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" /> Buy on WhatsApp
        </Button>
      </CardFooter>
    </Card>
  );
}
