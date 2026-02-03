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
import { MapPin, Crown, ShieldCheck, Store } from "lucide-react";
import { Watermark } from "@/components/watermark";
import { isBusinessPremium } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BusinessCardProps {
  business: Business & { distance?: number | null };
}

export function BusinessCard({ business }: BusinessCardProps) {
  const hasPremium = isBusinessPremium(business);
  
  const displayImage = (typeof business?.imageUrl === 'string' && business.imageUrl.trim() !== "") 
    ? business.imageUrl 
    : `https://picsum.photos/seed/${business?.id || 'shop'}/600/400`;
  
  const displayLogo = (typeof business?.logoUrl === 'string' && business.logoUrl.trim() !== "")
    ? business.logoUrl
    : null;
  
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
        
        <CardHeader className="p-0 relative">
          {/* Inner container for image zoom with overflow-hidden */}
          <div className="relative aspect-[4/3] w-full bg-muted group overflow-hidden rounded-t-lg">
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
          
          {/* Business Logo Overlap - Positioned outside the image container but inside the CardHeader */}
          <div className="absolute -bottom-7 left-4 z-20">
             <Avatar className="h-14 w-14 border-4 border-white shadow-xl bg-white">
               <AvatarImage src={displayLogo || ""} alt={business?.shopName} className="object-cover" />
               <AvatarFallback className="bg-primary/5 text-primary">
                 <Store className="h-6 w-6" />
               </AvatarFallback>
             </Avatar>
          </div>
        </CardHeader>
        
        <CardContent className="p-5 pt-10"> {/* Extra padding-top for the logo overlap */}
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
