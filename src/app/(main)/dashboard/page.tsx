"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, doc } from "firebase/firestore";
import { 
  useFirestore, 
  useCollection, 
  useDoc, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Loader2, 
  Trash2, 
  Package, 
  Store, 
  Save, 
  Image as ImageIcon, 
  Upload, 
  X,
  Phone,
  Info,
  Tag,
  MapPin,
  Globe
} from "lucide-react";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessCategory, Business, Product } from "@/lib/types";

const categoryList: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 'Others'
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Fetch business profile
  const businessRef = useMemoFirebase(() => user ? doc(firestore, "businesses", user.uid) : null, [firestore, user]);
  const { data: businessData, isLoading: loadingBusiness } = useDoc<Business>(businessRef);

  // Fetch products
  const productsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "products"), where("businessId", "==", user.uid)) : null, 
    [firestore, user]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  // Form states for Product
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    description: "",
    imageUrl: ""
  });

  // Form states for Shop Profile
  const [shopProfile, setShopProfile] = useState({
    shopName: "",
    shopCategory: "" as BusinessCategory | "",
    shopDescription: "",
    shopContact: "",
    shopImageUrl: ""
  });

  // Address parts state
  const [addressParts, setAddressParts] = useState({
    region: "India",
    state: "",
    city: "",
    street: "",
    landmark: "",
    pincode: ""
  });

  useEffect(() => {
    if (businessData) {
      setShopProfile({
        shopName: businessData.shopName || "",
        shopCategory: businessData.category || "",
        shopDescription: businessData.description || "",
        shopContact: businessData.contactNumber || "",
        shopImageUrl: businessData.imageUrl || ""
      });

      if (businessData.address) {
        const parts = businessData.address.split(", ").map(p => p.trim());
        if (parts.length >= 4) {
          setAddressParts({
            street: parts[0] || "",
            landmark: parts[1] || "",
            city: parts[2] || "",
            state: parts[3] || "",
            region: "India",
            pincode: businessData.address.split("-").pop()?.trim() || ""
          });
        }
      }
    }
  }, [businessData]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (userProfile && userProfile.role !== "business") {
        router.push("/");
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        toast({ variant: "destructive", title: "File too large", description: "Please select an image smaller than 800KB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newProduct.title || !newProduct.price || !newProduct.imageUrl) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please provide a name, price, and product image." });
      return;
    }

    setIsSubmittingProduct(true);
    const colRef = collection(firestore, "products");
    addDocumentNonBlocking(colRef, {
      businessId: user.uid,
      title: newProduct.title,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      imageUrl: newProduct.imageUrl,
      imageHint: 'product'
    });
    
    toast({ title: "Success", description: "Product listing initiated!" });
    setNewProduct({ title: "", price: "", description: "", imageUrl: "" });
    setIsProductDialogOpen(false);
    setIsSubmittingProduct(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const docRef = doc(firestore, "products", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Deleted", description: "Product removal initiated." });
  };

  const handleUpdateShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const fullAddress = `${addressParts.street}, ${addressParts.landmark}, ${addressParts.city}, ${addressParts.state}, ${addressParts.region} - ${addressParts.pincode}`;

    setIsUpdatingProfile(true);
    
    const businessDocRef = doc(firestore, "businesses", user.uid);
    setDocumentNonBlocking(businessDocRef, {
      id: user.uid,
      ownerId: user.uid,
      shopName: shopProfile.shopName,
      address: fullAddress,
      category: shopProfile.shopCategory,
      description: shopProfile.shopDescription,
      contactNumber: shopProfile.shopContact,
      whatsappLink: `https://wa.me/${shopProfile.shopContact}`,
      imageUrl: shopProfile.shopImageUrl,
      imageHint: 'shop'
    }, { merge: true });

    toast({ title: "Profile Updated", description: "Your shop details are being saved." });
    setIsUpdatingProfile(false);
  };

  if (authLoading || loadingBusiness || loadingProducts) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-navy dark:text-white flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            {businessData?.shopName || "My Business"}
          </h1>
          <p className="text-muted-foreground mt-1">Manage your digital storefront and catalog</p>
        </div>

        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddProduct}>
              <DialogHeader>
                <DialogTitle>New Product/Service</DialogTitle>
                <DialogDescription>Fill in the details for your new listing.</DialogDescription>
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
                  <Textarea id="description" placeholder="Short details about the item..." value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Product Image (From Device)</Label>
                  <div className="flex flex-col gap-4">
                    {newProduct.imageUrl && (
                      <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                        <Image src={newProduct.imageUrl} alt="Preview" fill className="object-cover" />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6" 
                          onClick={() => setNewProduct({ ...newProduct, imageUrl: "" })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Select from Gallery</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, (base64) => setNewProduct({ ...newProduct, imageUrl: base64 }))} 
                      />
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmittingProduct} className="w-full">
                  {isSubmittingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Listing"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>Live items visible to customers.</CardDescription>
                </CardHeader>
                <CardContent>
                  {!products || products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
                      <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold">No items found</h3>
                      <Button variant="outline" className="mt-4" onClick={() => setIsProductDialogOpen(true)}>Add your first item</Button>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden group relative transition-all hover:shadow-md">
                          <div className="relative aspect-video">
                            <Image src={product.imageUrl} alt={product.title} fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </Button>
                            </div>
                          </div>
                          <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
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
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Shop Profile Settings</CardTitle>
              <CardDescription>Update your shop details with a professional address and original photos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateShopProfile} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="shopName" className="flex items-center gap-2"><Store className="h-4 w-4" /> Shop Name</Label>
                    <Input id="shopName" placeholder="e.g. Sharma Kirana Store" value={shopProfile.shopName} onChange={(e) => setShopProfile({ ...shopProfile, shopName: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopCategory" className="flex items-center gap-2"><Tag className="h-4 w-4" /> Category</Label>
                    <Select value={shopProfile.shopCategory} onValueChange={(v: BusinessCategory) => setShopProfile({ ...shopProfile, shopCategory: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {categoryList.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopContact" className="flex items-center gap-2"><Phone className="h-4 w-4" /> Contact Number</Label>
                    <Input id="shopContact" placeholder="e.g. 9876543210" value={shopProfile.shopContact} onChange={(e) => setShopProfile({ ...shopProfile, shopContact: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="shopDescription" className="flex items-center gap-2"><Info className="h-4 w-4" /> About Shop</Label>
                    <Textarea id="shopDescription" placeholder="What makes your shop special?" value={shopProfile.shopDescription} onChange={(e) => setShopProfile({ ...shopProfile, shopDescription: e.target.value })} />
                </div>

                <div className="space-y-6 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Shop Location Details</h3>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" /> Region</Label>
                      <Select value={addressParts.region} disabled>
                        <SelectTrigger className="bg-muted">
                          <SelectValue placeholder="Select Region" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">State / UT</Label>
                      <Select 
                        value={addressParts.state} 
                        onValueChange={(v) => setAddressParts(prev => ({ ...prev, state: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {indianStates.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-muted-foreground">City / Town / Village</Label>
                      <Input 
                        id="city" 
                        placeholder="e.g. New Delhi" 
                        value={addressParts.city} 
                        onChange={(e) => setAddressParts(prev => ({ ...prev, city: e.target.value }))} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-muted-foreground">Pincode</Label>
                      <Input 
                        id="pincode" 
                        placeholder="e.g. 110001" 
                        value={addressParts.pincode} 
                        onChange={(e) => setAddressParts(prev => ({ ...prev, pincode: e.target.value }))} 
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-muted-foreground">House No, Building, Street, Road</Label>
                      <Input 
                        id="street" 
                        placeholder="e.g. Flat 102, Shanti Niwas, MG Road" 
                        value={addressParts.street} 
                        onChange={(e) => setAddressParts(prev => ({ ...prev, street: e.target.value }))} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="landmark" className="text-muted-foreground">Landmark (Optional)</Label>
                      <Input 
                        id="landmark" 
                        placeholder="e.g. Opposite City Park" 
                        value={addressParts.landmark} 
                        onChange={(e) => setAddressParts(prev => ({ ...prev, landmark: e.target.value }))} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <Label className="text-lg font-semibold flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" /> Shop Photo</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {shopProfile.shopImageUrl && (
                      <div className="relative aspect-video rounded-md overflow-hidden border group">
                        <Image src={shopProfile.shopImageUrl} alt="Shop" fill className="object-cover" />
                        <button 
                          type="button" 
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" 
                          onClick={() => setShopProfile(prev => ({ ...prev, shopImageUrl: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors border-primary/30">
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <Upload className="w-8 h-8 mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground font-medium">Upload Shop Photo</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(e, (base64) => setShopProfile(prev => ({ ...prev, shopImageUrl: base64 })))} 
                      />
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-lg shadow-lg hover:shadow-xl transition-all" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Save Shop Profile</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
