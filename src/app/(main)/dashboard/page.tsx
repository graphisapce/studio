
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
  Globe,
  Crown,
  Lock,
  CreditCard,
  CheckCircle2
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch business profile
  const businessRef = useMemoFirebase(() => user ? doc(firestore, "businesses", user.uid) : null, [firestore, user]);
  const { data: businessData, isLoading: loadingBusiness } = useDoc<Business>(businessRef);

  // Fetch products
  const productsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "products"), where("businessId", "==", user.uid)) : null, 
    [firestore, user]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  // Form states
  const [newProduct, setNewProduct] = useState({ title: "", price: "", description: "", imageUrl: "" });
  const [shopProfile, setShopProfile] = useState({ shopName: "", shopCategory: "" as BusinessCategory | "", shopDescription: "", shopContact: "", shopImageUrl: "" });
  const [addressParts, setAddressParts] = useState({ region: "India", state: "", city: "", street: "", landmark: "", pincode: "" });

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
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingProduct(true);
    addDocumentNonBlocking(collection(firestore, "products"), {
      businessId: user.uid,
      title: newProduct.title,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      imageUrl: newProduct.imageUrl,
      imageHint: 'product'
    });
    toast({ title: "Success", description: "Product added!" });
    setNewProduct({ title: "", price: "", description: "", imageUrl: "" });
    setIsProductDialogOpen(false);
    setIsSubmittingProduct(false);
  };

  const handleUpdateShopProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    const fullAddress = `${addressParts.street}, ${addressParts.landmark}, ${addressParts.city}, ${addressParts.state}, ${addressParts.region} - ${addressParts.pincode}`;
    setDocumentNonBlocking(doc(firestore, "businesses", user.uid), {
      id: user.uid,
      ownerId: user.uid,
      shopName: shopProfile.shopName,
      address: fullAddress,
      category: shopProfile.shopCategory,
      description: shopProfile.shopDescription,
      contactNumber: shopProfile.shopContact,
      whatsappLink: `https://wa.me/${shopProfile.shopContact.replace(/\D/g, '')}`,
      imageUrl: shopProfile.shopImageUrl,
      isPaid: businessData?.isPaid || false
    }, { merge: true });
    toast({ title: "Updated", description: "Profile saved." });
    setIsUpdatingProfile(false);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      if (user) {
        setDocumentNonBlocking(doc(firestore, "businesses", user.uid), {
          id: user.uid,
          ownerId: user.uid,
          isPaid: true
        }, { merge: true });
      }
      toast({ title: "Payment Successful", description: "Welcome to Premium!" });
      setTimeout(() => {
        setIsPaymentDialogOpen(false);
        setPaymentSuccess(false);
      }, 2000);
    }, 3000);
  };

  if (authLoading || loadingBusiness || loadingProducts) {
    return <div className="flex h-[80vh] flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-muted-foreground">Syncing Dashboard...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Store className="h-8 w-8 text-primary" />{businessData?.shopName || "My Business"}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Manage your digital storefront</p>
            {businessData?.isPaid && <Badge className="bg-yellow-500 flex gap-1"><Crown className="h-3 w-3" /> Premium</Badge>}
          </div>
        </div>

        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogTrigger asChild><Button size="lg"><PlusCircle className="mr-2 h-5 w-5" /> Add New Item</Button></DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddProduct}>
              <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="title">Item Name</Label><Input id="title" required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="price">Price (₹)</Label><Input id="price" type="number" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} /></div>
                <div className="grid gap-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
                <div className="grid gap-2"><Label>Image</Label><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setNewProduct({ ...newProduct, imageUrl: b }))} /></div>
              </div>
              <DialogFooter><Button type="submit" disabled={isSubmittingProduct} className="w-full">{isSubmittingProduct ? "Publishing..." : "Publish"}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="mb-8"><TabsTrigger value="listings">Your Listings</TabsTrigger><TabsTrigger value="profile">Shop Settings</TabsTrigger></TabsList>

        <TabsContent value="listings">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
                <CardContent>
                  {!products || products.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl"><Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p>No items found</p></div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {products.map((p) => (
                        <Card key={p.id} className="overflow-hidden">
                          <div className="relative aspect-video"><Image src={p.imageUrl} alt={p.title} fill className="object-cover" /></div>
                          <CardHeader className="p-4"><div className="flex justify-between font-bold"><span>{p.title}</span><span className="text-primary">₹{p.price}</span></div></CardHeader>
                          <CardFooter className="p-4 pt-0"><Button variant="destructive" size="sm" className="w-full" onClick={() => deleteDocumentNonBlocking(doc(firestore, "products", p.id))}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button></CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              {!businessData?.isPaid && (
                <Card className="border-yellow-200 bg-yellow-50/30">
                  <CardHeader><CardTitle className="text-yellow-700 flex gap-2"><Crown /> Upgrade to Premium</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm text-yellow-800"><li>✅ Direct WhatsApp Contact</li><li>✅ Premium Badge</li><li>✅ Priority Visibility</li></ul>
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                      <DialogTrigger asChild><Button className="w-full bg-yellow-600 hover:bg-yellow-700">Upgrade Now for ₹499/yr</Button></DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2"><CreditCard /> Secure Checkout</DialogTitle>
                          <DialogDescription>Unlock all premium features for your business.</DialogDescription>
                        </DialogHeader>
                        {paymentSuccess ? (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                            <h3 className="text-2xl font-bold">Payment Success!</h3>
                            <p className="text-muted-foreground">Redirecting to your premium dashboard...</p>
                          </div>
                        ) : (
                          <form onSubmit={handleProcessPayment} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Card Number</Label>
                              <Input placeholder="4242 4242 4242 4242" maxLength={19} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" maxLength={5} required /></div>
                              <div className="space-y-2"><Label>CVC</Label><Input placeholder="123" maxLength={3} type="password" required /></div>
                            </div>
                            <div className="bg-muted p-4 rounded-lg text-sm flex justify-between items-center">
                              <span>Total Amount:</span>
                              <span className="font-bold text-lg">₹499.00</span>
                            </div>
                            <Button type="submit" className="w-full h-12 text-lg" disabled={isProcessingPayment}>
                              {isProcessingPayment ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Securely...</> : "Pay ₹499 Securely"}
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground">Secure SSL encrypted payment processing</p>
                          </form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-4xl mx-auto">
            <CardHeader><CardTitle>Shop Profile Settings</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateShopProfile} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Shop Name</Label><Input value={shopProfile.shopName} onChange={(e) => setShopProfile({...shopProfile, shopName: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Category</Label>
                    <Select value={shopProfile.shopCategory} onValueChange={(v: BusinessCategory) => setShopProfile({...shopProfile, shopCategory: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Contact Number</Label><Input value={shopProfile.shopContact} onChange={(e) => setShopProfile({...shopProfile, shopContact: e.target.value})} /></div>
                <div className="space-y-2"><Label>About Shop</Label><Textarea value={shopProfile.shopDescription} onChange={(e) => setShopProfile({...shopProfile, shopDescription: e.target.value})} /></div>
                
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-bold flex gap-2"><MapPin /> Address Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>State</Label>
                      <Select value={addressParts.state} onValueChange={(v) => setAddressParts({...addressParts, state: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>City</Label><Input value={addressParts.city} onChange={(e) => setAddressParts({...addressParts, city: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Street / House No</Label><Input value={addressParts.street} onChange={(e) => setAddressParts({...addressParts, street: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Pincode</Label><Input value={addressParts.pincode} onChange={(e) => setAddressParts({...addressParts, pincode: e.target.value})} /></div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <Label>Shop Photo</Label>
                  <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setShopProfile({...shopProfile, shopImageUrl: b}))} />
                </div>

                <Button type="submit" className="w-full h-12" disabled={isUpdatingProfile}>{isUpdatingProfile ? <Loader2 className="animate-spin" /> : "Save Profile"}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
