
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/clientApp";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc,
  orderBy
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Trash2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface DashboardProduct {
  id: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  businessId: string;
}

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    description: "",
    imageUrl: ""
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile?.role !== "business") {
        router.push("/");
      }
    }
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "products"),
      where("businessId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productData: DashboardProduct[] = [];
      snapshot.forEach((doc) => {
        productData.push({ id: doc.id, ...doc.data() } as DashboardProduct);
      });
      setProducts(productData);
      setLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Use a random picsum image if none provided
      const finalImageUrl = newProduct.imageUrl || `https://picsum.photos/seed/${Math.random()}/600/400`;

      await addDoc(collection(db, "products"), {
        businessId: user.uid,
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        imageUrl: finalImageUrl,
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Product added successfully!",
      });

      setNewProduct({ title: "", price: "", description: "", imageUrl: "" });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add product",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteDoc(doc(db, "products", id));
      toast({
        title: "Deleted",
        description: "Product removed successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product.",
      });
    }
  };

  if (authLoading || loadingProducts) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-navy dark:text-white">
            Business Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your shop and products</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddProduct}>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Enter the details of your product or service here.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Product Name</Label>
                  <Input
                    id="title"
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    placeholder="e.g. Special Chole Bhature"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Tell customers about this product..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Products</CardTitle>
              <CardDescription>
                These are currently visible to your customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">No products listed yet.</p>
                  <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                    Add your first product
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden border bg-secondary/10">
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{product.title}</CardTitle>
                        <CardDescription className="line-clamp-1">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex items-center justify-between">
                        <span className="font-bold text-primary">₹{product.price}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Shop Profile</CardTitle>
              <CardDescription>Update your shop's identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Owner Name</Label>
                <Input value={userProfile?.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Business Email</Label>
                <Input value={userProfile?.email} disabled />
              </div>
              <p className="text-xs text-muted-foreground italic">
                More shop settings (Logo, Address, WhatsApp) coming soon in the next update.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
