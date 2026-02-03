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
  Info
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
const MY_UPI_ID = "yourname@upi"; // Apni UPI ID yahan dalein
const MY_QR_CODE_URL = "https://picsum.photos/seed/myqr/300/300"; // Apne QR Code ki image URL yahan dalein
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
      imageUrl: newProduct.imageUrl || "https://picsum.photos/seed/item/400/300",
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
      imageUrl: shopProfile.shopImageUrl || "https://picsum.photos/seed/shop/800/400",
      isPaid: businessData?.isPaid || false,
      premiumUntil: businessData?.premiumUntil || null
    }, { merge: true });
    toast({ title: "Updated", description: "Profile saved." });
    setIsUpdatingProfile(false);
  };

  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    // Simulation
    setTimeout(() => {
      if (user) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days monthly subscription
        
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
    return <div className="flex h-[80vh] flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-muted-foreground">Syncing Dashboard...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><Store className="h-8 w-8 text-primary" />{businessData?.shopName || "My Business"}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-muted-foreground">Manage your digital storefront</p>
            {hasPremium && (
              <Badge className="bg-yellow-500 flex gap-1 animate-pulse">
                <Crown className="h-3 w-3" /> Premium Active
              </Badge>
            )}
            {businessData?.premiumUntil && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Expiring: {new Date(businessData.premiumUntil).toLocaleDateString()}
              </span>
            )}
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
              {!hasPremium && (
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader><CardTitle className="text-yellow-700 flex gap-2 items-center"><Crown className="text-yellow-500" /> Unlock Premium</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">
                       <p className="text-xl font-bold text-center text-primary">₹99 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                    </div>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li className="flex items-center gap-2">✅ Direct WhatsApp Button</li>
                      <li className="flex items-center gap-2">✅ Premium Badge on Profile</li>
                      <li className="flex items-center gap-2">✅ Boosted Visibility</li>
                    </ul>
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                      <DialogTrigger asChild><Button className="w-full bg-yellow-600 hover:bg-yellow-700 font-bold">Buy Monthly Subscription</Button></DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Choose Payment Method</DialogTitle>
                          <DialogDescription>Pay ₹99 for 30 days of premium benefits.</DialogDescription>
                        </DialogHeader>
                        
                        {paymentSuccess ? (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                            <h3 className="text-2xl font-bold">Payment Success!</h3>
                            <p className="text-muted-foreground">Your premium features are now active.</p>
                          </div>
                        ) : (
                          <Tabs defaultValue="upi" className="w-full mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="upi" className="flex gap-2"><Smartphone className="h-4 w-4" /> UPI / QR</TabsTrigger>
                              <TabsTrigger value="card" className="flex gap-2"><CreditCard className="h-4 w-4" /> Card</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="upi" className="space-y-6 py-4">
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <p className="text-sm text-center text-muted-foreground">Scan QR to pay ₹99</p>
                                <div className="relative h-48 w-48 border-4 border-primary/20 rounded-xl overflow-hidden p-2 bg-white">
                                  <Image src={MY_QR_CODE_URL} alt="UPI QR" fill className="object-contain" />
                                </div>
                                <div className="text-center space-y-2 w-full">
                                  <Label className="text-xs uppercase text-muted-foreground">Or pay to UPI ID</Label>
                                  <div className="flex items-center gap-2 bg-muted p-2 rounded border justify-between">
                                    <code className="text-sm font-bold">{MY_UPI_ID}</code>
                                    <Button variant="ghost" size="sm" className="h-8 text-[10px]" onClick={() => {
                                      navigator.clipboard.writeText(MY_UPI_ID);
                                      toast({ title: "Copied", description: "UPI ID copied to clipboard" });
                                    }}>Copy</Button>
                                  </div>
                                </div>
                              </div>
                              <Button className="w-full h-12" onClick={handleProcessPayment} disabled={isProcessingPayment}>
                                {isProcessingPayment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Payment...</> : "I have paid ₹99"}
                              </Button>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-blue-50 p-2 rounded">
                                <Info className="h-3 w-3" /> Note: Verification takes 1-2 seconds after you click.
                              </div>
                            </TabsContent>

                            <TabsContent value="card" className="space-y-4 py-4">
                              <div className="space-y-2"><Label>Card Number</Label><Input placeholder="4242 4242 4242 4242" maxLength={19} /></div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" /></div>
                                <div className="space-y-2"><Label>CVC</Label><Input placeholder="123" type="password" /></div>
                              </div>
                              <Button className="w-full h-12" onClick={handleProcessPayment} disabled={isProcessingPayment}>
                                {isProcessingPayment ? "Processing..." : "Pay ₹99 Securely"}
                              </Button>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
              
              {hasPremium && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader><CardTitle className="text-green-700 flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4" /> Subscription Active</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xs text-green-600">All features unlocked until {new Date(businessData?.premiumUntil || "").toLocaleDateString()}. Enjoy boosted visibility!</p>
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
                <div className="space-y-2"><Label>Contact Number</Label><Input placeholder="e.g. 9876543210" value={shopProfile.shopContact} onChange={(e) => setShopProfile({...shopProfile, shopContact: e.target.value})} /></div>
                <div className="space-y-2"><Label>About Shop</Label><Textarea placeholder="Describe what you sell or offer..." value={shopProfile.shopDescription} onChange={(e) => setShopProfile({...shopProfile, shopDescription: e.target.value})} /></div>
                
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-bold flex gap-2 items-center"><MapPin className="h-4 w-4" /> Address Details</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>State</Label>
                      <Select value={addressParts.state} onValueChange={(v) => setAddressParts({...addressParts, state: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>City</Label><Input value={addressParts.city} onChange={(e) => setAddressParts({...addressParts, city: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Street / Shop No</Label><Input value={addressParts.street} onChange={(e) => setAddressParts({...addressParts, street: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Pincode</Label><Input value={addressParts.pincode} onChange={(e) => setAddressParts({...addressParts, pincode: e.target.value})} /></div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <Label>Shop Banner Image</Label>
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
