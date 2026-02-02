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
  serverTimestamp
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Trash2, Package, Store } from "lucide-react";
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

    // Real-time listener for products
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
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to sync products. Please check your network.",
      });
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newProduct.title || !newProduct.price) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please enter at least a name and price.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalImageUrl = newProduct.imageUrl || `https://picsum.photos/seed/${Math.random()}/600/400`;

      await addDoc(collection(db, "products"), {
        businessId: user.uid,
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        imageUrl: finalImageUrl,
        createdAt: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Product added successfully!",
      });

      setNewProduct({ title: "", price: "", description: "", imageUrl: "" });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add product. Check if you are logged in as business.",
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

  if (authLoading || (loadingProducts && user)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading your shop...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-navy dark:text-white flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            Shop Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your digital storefront</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddProduct}>
              <DialogHeader>
                <DialogTitle>Create Product/Service</DialogTitle>
                <DialogDescription>
                  This will be visible to all customers in the marketplace.
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
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Explain what makes this item special..."
                    className="h-24"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image Link (Optional)</Label>
                  <Input
                    id="imageUrl"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    placeholder="https://example.com/item-image.jpg"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Leave empty for a random placeholder image.</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Publish to Shop"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-2">
            <CardHeader className="bg-secondary/5 rounded-t-lg">
              <CardTitle className="text-xl">Your Listings</CardTitle>
              <CardDescription>
                Currently active items in your catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/20">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-lg font-semibold">No products yet</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mb-6">
                    Start adding items to your shop to attract local customers.
                  </p>
                  <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                    Add your first product
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden group hover:border-primary/50 transition-colors shadow-md">
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2">
                           <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-lg">{product.title}</CardTitle>
                          <span className="font-bold text-primary text-lg">₹{product.price}</span>
                        </div>
                        <CardDescription className="line-clamp-2 min-h-[40px]">{product.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Shop Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-lg border shadow-sm text-center">
                  <p className="text-2xl font-bold text-primary">{products.length}</p>
                  <p className="text-xs text-muted-foreground">Total Products</p>
                </div>
                <div className="p-4 bg-background rounded-lg border shadow-sm text-center">
                  <p className="text-2xl font-bold text-green-600">Active</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Owner Details</CardTitle>
              <CardDescription>Verified business information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Full Name</Label>
                <p className="font-medium">{userProfile?.name || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase text-muted-foreground font-bold">Business Email</Label>
                <p className="font-medium text-sm truncate">{userProfile?.email}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  To change your shop name or address, please visit the Shop Settings page (Coming Soon).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}