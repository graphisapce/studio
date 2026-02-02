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
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
            data-ai-hint={product.imageHint}
          />
           <Watermark />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-md font-semibold mb-1">{product.title}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <p className="text-lg font-bold text-primary">₹{product.price.toFixed(2)}</p>
      </CardFooter>
    </Card>
  );
}
