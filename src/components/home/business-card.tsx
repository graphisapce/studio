import Image from "next/image";
import Link from "next/link";
import type { Business } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Crown, ShieldCheck } from "lucide-react";
import { Watermark } from "@/components/watermark";
import { isBusinessPremium } from "@/lib/utils";

interface BusinessCardProps {
  business: Business & { distance?: number | null };
}

export function BusinessCard({ business }: BusinessCardProps) {
  const hasPremium = isBusinessPremium(business);
  
  const displayImage = (typeof business?.imageUrl === 'string' && business.imageUrl.trim() !== "") 
    ? business.imageUrl 
    : `https://picsum.photos/seed/${business?.id || 'shop'}/600/400`;
  
  return (
    <Link href={`/business/${business?.id}`}>
      <Card className="h-full overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative border-none bg-white shadow-md">
        {hasPremium && (
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <Badge className="bg-yellow-500 hover:bg-yellow-600 border-none flex gap-1 shadow-lg py-1 px-3">
              <Crown className="h-3 w-3" /> Premium
            </Badge>
          </div>
        )}
        
        <CardHeader className="p-0 relative overflow-hidden">
          <div className="relative aspect-[4/3] w-full bg-muted group">
            <Image
              src={displayImage}
              alt={business?.shopName || "Business"}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              data-ai-hint={business?.imageHint || "shop"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <Watermark />
          </div>
        </CardHeader>
        
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-2">
             <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-bold px-3">
               {business?.category || 'General'}
             </Badge>
             {hasPremium && <ShieldCheck className="h-4 w-4 text-primary" />}
          </div>
          
          <CardTitle className="text-xl font-headline mb-2 truncate group-hover:text-primary transition-colors">
            {business?.shopName || "Unnamed Shop"}
          </CardTitle>
          
          <CardDescription className="flex items-start gap-1 text-xs text-muted-foreground line-clamp-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>{business?.address || "Address not available"}</span>
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
