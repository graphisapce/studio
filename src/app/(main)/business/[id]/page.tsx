import Image from 'next/image';
import { notFound } from 'next/navigation';
import { mockBusinesses, mockProducts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Phone, MessageCircle } from 'lucide-react';
import { ProductCard } from '@/components/business/product-card';
import { Watermark } from '@/components/watermark';

export async function generateStaticParams() {
  return mockBusinesses.map((business) => ({
    id: business.id,
  }));
}

export default function BusinessDetailPage({ params }: { params: { id: string } }) {
  const business = mockBusinesses.find((b) => b.id === params.id);
  const products = mockProducts.filter((p) => p.businessId === params.id);

  if (!business) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <header className="mb-8">
        <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg shadow-lg">
          <Image
            src={business.imageUrl}
            alt={business.shopName}
            fill
            className="object-cover"
            priority
            data-ai-hint={business.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
           <Watermark className="!text-white/90" />
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl md:text-5xl font-bold text-white font-headline">
              {business.shopName}
            </h1>
            <p className="text-lg text-white/90 mt-1">{business.address}</p>
          </div>
        </div>
      </header>

      <main>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="flex-1">
              <a href={`tel:${business.contactNumber}`}>
                <Phone className="mr-2 h-5 w-5" /> Call Now
              </a>
            </Button>
            <Button asChild size="lg" variant="secondary" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
              <a href={business.whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-2xl md:text-3xl font-bold mb-6 font-headline text-navy dark:text-white">
            Products & Services
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold">No products listed yet</h3>
              <p className="text-muted-foreground mt-2">
                This business hasn't added any products or services. Check back later!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
