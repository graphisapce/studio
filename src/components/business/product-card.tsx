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
import { Watermark } from "@/components/watermark";

export function ProductCard({ product }: { product: Product }) {
  // Ensure we have a valid image URL or a fallback
  const displayImage = product.imageUrl && product.imageUrl.trim() !== "" 
    ? product.imageUrl 
    : `https://picsum.photos/seed/prod-${product.id}/400/300`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={displayImage}
            alt={product.title || "Product"}
            fill
            className="object-cover"
            data-ai-hint={product.imageHint || "product"}
          />
           <Watermark />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-md font-semibold mb-1">{product.title || "Unnamed Product"}</CardTitle>
        <CardDescription>{product.description || "No description provided."}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-lg font-bold text-primary">₹{(product.price || 0).toFixed(2)}</p>
      </CardFooter>
    </Card>
  );
}
