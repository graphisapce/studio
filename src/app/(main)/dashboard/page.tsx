
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
  updateDoc,
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
import { PlusCircle, Loader2, Trash2, Package, Store, Save, Image as ImageIcon, MapPin } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Form states for Product
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    description: "",
    imageUrl: ""
  });

  // Form states for Shop Profile
  const [shopProfile, setShopProfile] = useState({
    shopName: userProfile?.shopName || "",
    shopAddress: userProfile?.shopAddress || "",
    shopImageUrls: userProfile?.shopImageUrls || [""]
  });

  useEffect(() => {
    if (userProfile) {
      setShopProfile({
        shopName: userProfile.shopName || "",
        shopAddress: userProfile.shopAddress || "",
        shopImageUrls: userProfile.shopImageUrls && userProfile.shopImageUrls.length > 0 
          ? userProfile.shopImageUrls 
          : [""]
      });
    }
  }, [userProfile]);

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

    if (!newProduct.title || !newProduct.price) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please enter at least a name and price." });
      return;
    }

    setIsSubmittingProduct(true);
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
      toast({ title: "Success", description: "Product added successfully!" });
      setNewProduct({ title: "", price: "", description: "", imageUrl: "" });
      setIsProductDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to add product." });
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast({ title: "Deleted", description: "Product removed successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete product." });
    }
  };

  const handleUpdateShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      // Filter out empty URLs
      const validImageUrls = shopProfile.shopImageUrls.filter(url => url.trim() !== "");
      
      await updateDoc(doc(db, "users", user.uid), {
        shopName: shopProfile.shopName,
        shopAddress: shopProfile.shopAddress,
        shopImageUrls: validImageUrls,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Profile Updated", description: "Your shop details have been saved." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddImageUrl = () => {
    setShopProfile({
      ...shopProfile,
      shopImageUrls: [...shopProfile.shopImageUrls, ""]
    });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...shopProfile.shopImageUrls];
    newUrls[index] = value;
    setShopProfile({ ...shopProfile, shopImageUrls: newUrls });
  };

  const handleRemoveImageUrl = (index: number) => {
    if (shopProfile.shopImageUrls.length === 1) {
       handleImageUrlChange(0, "");
       return;
    }
    const newUrls = shopProfile.shopImageUrls.filter((_, i) => i !== index);
    setShopProfile({ ...shopProfile, shopImageUrls: newUrls });
  };

  if (authLoading || (loadingProducts && user)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-navy dark:text-white flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            {userProfile?.shopName || "Shop Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">Manage your digital storefront and listings</p>
        </div>

        <div className="flex gap-2">
           <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddProduct}>
                <DialogHeader>
                  <DialogTitle>New Product/Service</DialogTitle>
                  <DialogDescription>Add items for customers to see.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Item Name</Label>
                    <Input id="title" required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imageUrl">Image Link (URL)</Label>
                    <Input id="imageUrl" placeholder="https://..." value={newProduct.imageUrl} onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmittingProduct} className="w-full">
                    {isSubmittingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Item"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md">
          <TabsTrigger value="listings">Your Listings</TabsTrigger>
          <TabsTrigger value="profile">Shop Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Catalog</CardTitle>
                  <CardDescription>Items visible in your shop.</CardDescription>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
                      <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold">No products yet</h3>
                      <Button variant="outline" className="mt-4" onClick={() => setIsProductDialogOpen(true)}>Add your first item</Button>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden group relative">
                          <div className="relative aspect-video">
                            <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <CardHeader className="p-4">
                            <div className="flex justify-between">
                              <CardTitle className="text-lg">{product.title}</CardTitle>
                              <span className="font-bold text-primary">₹{product.price}</span>
                            </div>
                            <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Shop Photos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {userProfile?.shopImageUrls?.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-md overflow-hidden border">
                      <Image src={url} alt="Shop" fill className="object-cover" />
                    </div>
                  )) || <p className="col-span-2 text-xs text-muted-foreground italic text-center py-4">No shop photos added yet.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick View</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground text-sm">Total Items</span>
                    <span className="font-bold">{products.length}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground text-sm">Shop Name</span>
                    <span className="font-medium truncate max-w-[120px]">{userProfile?.shopName || "N/A"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Original Shop Details</CardTitle>
              <CardDescription>Provide original details and photos to build trust with customers.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateShopProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop Name</Label>
                  <Input id="shopName" placeholder="e.g. Sharma Kirana Store" value={shopProfile.shopName} onChange={(e) => setShopProfile({ ...shopProfile, shopName: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopAddress">Shop Address</Label>
                  <Textarea id="shopAddress" placeholder="Street number, Colony, Landmark..." value={shopProfile.shopAddress} onChange={(e) => setShopProfile({ ...shopProfile, shopAddress: e.target.value })} />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Shop Photos (URLs)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddImageUrl}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Photo
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Add URLs of photos showing your shop's original board, interior, and products.</p>
                  
                  {shopProfile.shopImageUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Input placeholder="https://..." value={url} onChange={(e) => handleImageUrlChange(index, e.target.value)} />
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveImageUrl(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Shop Profile</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
