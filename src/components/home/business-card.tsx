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
import { MapPin } from "lucide-react";
import { Watermark } from "@/components/watermark";

export function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/business/${business.id}`}>
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative aspect-[3/2] w-full">
            <Image
              src={business.imageUrl}
              alt={business.shopName}
              fill
              className="object-cover"
              data-ai-hint={business.imageHint}
            />
            <Watermark />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <Badge variant="secondary" className="mb-2">{business.category}</Badge>
          <CardTitle className="text-lg font-headline mb-1">{business.shopName}</CardTitle>
          <CardDescription className="flex items-center gap-1 text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{business.address}</span>
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}
