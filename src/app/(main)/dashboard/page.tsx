
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
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Phone,
  MapPin,
  Crown,
  CreditCard,
  CheckCircle2,
  QrCode,
  Smartphone,
  CalendarDays,
  Info,
  Copy,
  AlertCircle
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
import { isBusinessPremium } from "@/lib/utils";

// --- CONFIGURATION: EDIT YOUR DETAILS HERE ---
const MY_UPI_ID = "9821692147-2@ybl"; 
const MY_QR_CODE_URL = "https://i.ibb.co/B5DB6Vzn/qr-code.png"; // Updated to use direct ImgBB link if possible
// ---------------------------------------------

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
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
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

  const [newProduct, setNewProduct] = useState({ title: "", price: "", description: "", imageUrl: "" });
  const [shopProfile, setShopProfile] = useState({ shopName: "", shopCategory: "" as BusinessCategory | "", shopDescription: "", shopContact: "", shopImageUrl: "" });
  const [addressParts, setAddressParts] = useState({ region: "India", state: "", city: "", street: "", landmark: "", pincode: "" });

  const hasPremium = isBusinessPremium(businessData);

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
        if (parts.length >= 5) {
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
      if (!user) router.push("/login");
      else if (userProfile && userProfile.role !== "business") router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
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
      imageUrl: newProduct.imageUrl || "",
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
      imageUrl: shopProfile.shopImageUrl || "",
      isPaid: businessData?.isPaid || false,
      premiumUntil: businessData?.premiumUntil || null
    }, { merge: true });
    toast({ title: "Updated", description: "Profile saved." });
    setIsUpdatingProfile(false);
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      if (user) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); 
        
        setDocumentNonBlocking(doc(firestore, "businesses", user.uid), {
          id: user.uid,
          ownerId: user.uid,
          isPaid: true,
          premiumUntil: expiryDate.toISOString()
        }, { merge: true });
      }
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      toast({ title: "Premium Activated", description: "Your 30-day subscription is active!" });
      setTimeout(() => {
        setIsPaymentDialogOpen(false);
        setPaymentSuccess(false);
      }, 2000);
    }, 2500);
  };

  if (authLoading || loadingBusiness || loadingProducts) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            {businessData?.shopName || "My Business"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground">Manage your digital storefront</p>
            {hasPremium && (
              <Badge className="bg-yellow-500 flex gap-1 animate-pulse">
                <Crown className="h-3 w-3" /> Premium Active
              </Badge>
            )}
            {businessData?.premiumUntil && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                <CalendarDays className="h-3 w-3" /> Valid Until: {new Date(businessData.premiumUntil).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
           <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddProduct}>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
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
                    <Label htmlFor="desc">Description</Label>
                    <Textarea id="desc" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Product Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setNewProduct({ ...newProduct, imageUrl: b }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmittingProduct} className="w-full">
                    {isSubmittingProduct ? "Publishing..." : "Publish Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="listings">Your Listings</TabsTrigger>
          <TabsTrigger value="profile">Shop Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  {!products || products.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                      <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p>No items found. Start by adding your first product.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {products.map((p) => {
                        const prodImg = (typeof p.imageUrl === 'string' && p.imageUrl.trim() !== "")
                          ? p.imageUrl 
                          : `https://picsum.photos/seed/prod-${p.id}/400/300`;
                        return (
                          <Card key={p.id} className="overflow-hidden group">
                            <div className="relative aspect-video bg-muted">
                              <Image src={prodImg} alt={p.title} fill className="object-cover" />
                            </div>
                            <CardHeader className="p-4 pb-2">
                              <div className="flex justify-between font-bold">
                                <span>{p.title}</span>
                                <span className="text-primary">₹{p.price}</span>
                              </div>
                            </CardHeader>
                            <CardFooter className="p-4 pt-0">
                              <Button variant="destructive" size="sm" className="w-full opacity-80 group-hover:opacity-100 transition-opacity" onClick={() => deleteDocumentNonBlocking(doc(firestore, "products", p.id))}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Item
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              {!hasPremium ? (
                <Card className="border-yellow-200 bg-yellow-50/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Crown className="h-20 w-20 rotate-12" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-yellow-700 flex gap-2 items-center">
                      <Crown className="text-yellow-500" /> Unlock Premium
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="bg-white p-4 rounded-lg border border-yellow-100 shadow-sm text-center">
                       <p className="text-3xl font-bold text-primary">₹99</p>
                       <p className="text-xs text-muted-foreground font-bold">PER MONTH</p>
                    </div>
                    <ul className="space-y-3 text-sm text-yellow-800">
                      <li className="flex items-center gap-2">✅ Direct WhatsApp Button</li>
                      <li className="flex items-center gap-2">✅ Premium Verified Badge</li>
                      <li className="flex items-center gap-2">✅ Top Ranking in Search</li>
                      <li className="flex items-center gap-2">✅ Shop Analytics</li>
                    </ul>
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-yellow-600 hover:bg-yellow-700 font-bold h-12 shadow-md">
                          Buy Premium Subscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" /> 30-Day Subscription
                          </DialogTitle>
                          <DialogDescription>Pay ₹99 to activate premium features for 1 month.</DialogDescription>
                        </DialogHeader>
                        
                        {paymentSuccess ? (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                            <h3 className="text-2xl font-bold">Payment Verified!</h3>
                            <p className="text-muted-foreground">Premium features are now active.</p>
                          </div>
                        ) : (
                          <Tabs defaultValue="upi" className="w-full mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="upi" className="flex gap-2">
                                <Smartphone className="h-4 w-4" /> UPI / QR
                              </TabsTrigger>
                              <TabsTrigger value="card" className="flex gap-2">
                                <CreditCard className="h-4 w-4" /> Card
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="upi" className="space-y-6 py-4">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="text-center">
                                  <p className="text-sm font-bold text-muted-foreground">Scan QR & Pay ₹99</p>
                                </div>
                                <div className="relative h-64 w-64 border-4 border-primary/20 rounded-2xl overflow-hidden p-4 bg-white shadow-xl flex items-center justify-center">
                                  <img 
                                    src={MY_QR_CODE_URL} 
                                    alt="UPI QR Code" 
                                    className="h-full w-full object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent && !parent.querySelector('.error-msg')) {
                                        const msg = document.createElement('div');
                                        msg.className = 'error-msg text-center text-xs text-muted-foreground p-2';
                                        msg.innerHTML = '<div class="text-destructive mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>QR Image Failed to Load.<br/>Use Direct Image Link.';
                                        parent.appendChild(msg);
                                      }
                                    }}
                                  />
                                </div>
                                <div className="text-center space-y-2 w-full">
                                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Or Use UPI ID</Label>
                                  <div className="flex items-center gap-2 bg-muted p-3 rounded-xl border-2 border-dashed border-primary/20 justify-between">
                                    <code className="text-sm font-bold text-primary">{MY_UPI_ID}</code>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10" onClick={() => {
                                      navigator.clipboard.writeText(MY_UPI_ID);
                                      toast({ title: "Copied!", description: "UPI ID copied to clipboard." });
                                    }}>
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <Button className="w-full h-14 text-lg font-black shadow-lg" onClick={handleProcessPayment} disabled={isProcessingPayment}>
                                {isProcessingPayment ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying Payment...</> : "I Have Paid ₹99"}
                              </Button>
                            </TabsContent>

                            <TabsContent value="card" className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Card Number</Label>
                                <Input placeholder="4242 4242 4242 4242" maxLength={19} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" /></div>
                                <div className="space-y-2"><Label>CVC</Label><Input placeholder="123" type="password" /></div>
                              </div>
                              <Button className="w-full h-12 font-bold" onClick={handleProcessPayment} disabled={isProcessingPayment}>
                                {isProcessingPayment ? "Processing..." : "Pay ₹99 Securely"}
                              </Button>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-green-50 border-green-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-green-700 flex items-center gap-2 text-sm font-bold">
                      <CheckCircle2 className="h-5 w-5 text-green-500" /> Subscription Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-green-700 font-medium">
                      Premium features are active until: <span className="font-bold underline">{new Date(businessData?.premiumUntil || "").toLocaleDateString()}</span>
                    </p>
                    <p className="text-[10px] text-green-600 italic">
                      WhatsApp button is now visible to all customers.
                    </p>
                    <Button variant="outline" className="w-full mt-2 text-xs border-green-300 text-green-700 hover:bg-green-100 font-bold" onClick={() => setIsPaymentDialogOpen(true)}>
                       Renew Early (Add 30 Days)
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-4xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle>Shop Profile Settings</CardTitle>
              <CardDescription>Update your digital storefront information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateShopProfile} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Shop Name</Label>
                    <Input value={shopProfile.shopName} onChange={(e) => setShopProfile({...shopProfile, shopName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={shopProfile.shopCategory} onValueChange={(v: BusinessCategory) => setShopProfile({...shopProfile, shopCategory: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp Number (With Country Code, e.g. 919876543210)</Label>
                  <Input placeholder="e.g. 919876543210" value={shopProfile.shopContact} onChange={(e) => setShopProfile({...shopProfile, shopContact: e.target.value})} />
                </div>

                <div className="space-y-2">
                  <Label>About Your Shop</Label>
                  <Input className="min-h-[120px]" placeholder="Describe your shop..." value={shopProfile.shopDescription} onChange={(e) => setShopProfile({...shopProfile, shopDescription: e.target.value})} />
                </div>
                
                <div className="space-y-6 border-t pt-8">
                  <h3 className="font-bold flex gap-2 items-center text-primary"><MapPin className="h-5 w-5" /> Shop Location Address</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select value={addressParts.state} onValueChange={(v) => setAddressParts({...addressParts, state: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>City / Town</Label><Input placeholder="City name" value={addressParts.city} onChange={(e) => setAddressParts({...addressParts, city: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Shop No. / Street</Label><Input placeholder="Road name or Street" value={addressParts.street} onChange={(e) => setAddressParts({...addressParts, street: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Landmark</Label><Input placeholder="Nearby famous place" value={addressParts.landmark} onChange={(e) => setAddressParts({...addressParts, landmark: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Pincode</Label><Input placeholder="6-digit PIN" maxLength={6} value={addressParts.pincode} onChange={(e) => setAddressParts({...addressParts, pincode: e.target.value})} /></div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-8">
                  <Label className="text-lg">Shop Banner Image</Label>
                  <div className="flex flex-col gap-4">
                    {shopProfile.shopImageUrl && typeof shopProfile.shopImageUrl === 'string' && (
                      <div className="relative h-48 w-full rounded-xl overflow-hidden border-2 shadow-inner bg-muted">
                        <Image src={shopProfile.shopImageUrl} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setShopProfile({...shopProfile, shopImageUrl: b}))} />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-black shadow-lg" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <><Loader2 className="animate-spin mr-2" /> Saving Changes...</> : "Save All Shop Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
