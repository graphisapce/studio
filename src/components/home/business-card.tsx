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
import { MapPin, Crown } from "lucide-react";
import { Watermark } from "@/components/watermark";
import { isBusinessPremium } from "@/lib/utils";

export function BusinessCard({ business }: { business: Business }) {
  const hasPremium = isBusinessPremium(business);
  // Ensure we have a valid image URL or a fallback
  const displayImage = business.imageUrl && business.imageUrl.trim() !== "" 
    ? business.imageUrl 
    : `https://picsum.photos/seed/${business.id}/600/400`;
  
  return (
    <Link href={`/business/${business.id}`}>
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative">
        {hasPremium && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-yellow-500 border-none flex gap-1 shadow-md">
              <Crown className="h-3 w-3" /> Premium
            </Badge>
          </div>
        )}
        <CardHeader className="p-0">
          <div className="relative aspect-[3/2] w-full bg-muted">
            <Image
              src={displayImage}
              alt={business.shopName || "Business"}
              fill
              className="object-cover"
              data-ai-hint={business.imageHint || "shop"}
            />
            <Watermark />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-1">
             <Badge variant="secondary" className="mb-1">{business.category}</Badge>
          </div>
          <CardTitle className="text-lg font-headline mb-1 truncate">{business.shopName || "Unnamed Shop"}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm line-clamp-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{business.address || "Address not available"}</span>
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
