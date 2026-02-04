
"use client";

import { useState, useEffect, useMemo } from "react";
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
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  useAuth as useFirebaseAuth
} from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
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
  Crown, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  Sparkles, 
  QrCode, 
  CreditCard, 
  Zap, 
  Printer, 
  History, 
  PhoneCall, 
  MessageCircle, 
  Share2,
  Tag,
  Rocket,
  Instagram,
  Facebook,
  Upload,
  Image as ImageIcon,
  Download,
  AlertCircle,
  UserCircle,
  Lock,
  Save,
  MapPin,
  Mail,
  Phone,
  Building2,
  Truck
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
import { BusinessCategory, Business, Product, Order } from "@/lib/types";
import { isBusinessPremium } from "@/lib/utils";
import { generateProductDescription } from "@/ai/flows/generate-description-flow";
import { generateSocialCaption } from "@/ai/flows/social-caption-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const categoryList: BusinessCategory[] = [
  'Food', 'Groceries', 'Retail', 'Electronics', 'Repairs', 'Services', 
  'Beauty', 'Health', 'Education', 'Automobile', 'Gifts', 'Home Decor', 
  'Clothing', 'Jewelry', 'Hardware', 'Pharmacy', 'Stationery', 
  'Advocate', 'Loha Welding', 'Bike Seat Cover', 'Bike Repair', 'Car Repair', 'Car Painter',
  'Others'
];

const stateList = [
  "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Bihar", 
  "West Bengal", "Gujarat", "Rajasthan", "Punjab", "Haryana", "Madhya Pradesh", "Others"
];

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();
  
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [origin, setOrigin] = useState("");
  
  const businessRef = useMemoFirebase(() => user ? doc(firestore, "businesses", user.uid) : null, [firestore, user]);
  const { data: businessData, isLoading: loadingBusiness } = useDoc<Business>(businessRef);

  const productsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "products"), where("businessId", "==", user.uid)) : null, 
    [firestore, user]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  const ordersQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "orders"), where("businessId", "==", user.uid)) : null, 
    [firestore, user]
  );
  const { data: incomingOrders, isLoading: loadingOrders } = useCollection<Order>(ordersQuery);

  const [newProduct, setNewProduct] = useState({ title: "", price: "", description: "", imageUrl: "", badge: "" });
  const [shopProfile, setShopProfile] = useState({ 
    shopName: "", 
    shopCategory: "" as BusinessCategory | "", 
    shopDescription: "", 
    shopContact: "", 
    shopImageUrl: "", 
    shopLogoUrl: "",
    openingTime: "09:00",
    closingTime: "21:00",
    upiId: "",
    paymentQrUrl: "",
    flashDeal: "",
    instagramUrl: "",
    facebookUrl: ""
  });

  const [accountInfo, setAccountInfo] = useState({
    name: "",
    phone: "",
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  });

  const hasPremium = isBusinessPremium(businessData);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (businessData) {
      setShopProfile({
        shopName: businessData.shopName || "",
        shopCategory: businessData.category || "",
        shopDescription: businessData.description || "",
        shopContact: businessData.contactNumber || "",
        shopImageUrl: businessData.imageUrl || "",
        shopLogoUrl: businessData.logoUrl || "",
        openingTime: businessData.openingTime || "09:00",
        closingTime: businessData.closingTime || "21:00",
        upiId: businessData.upiId || "",
        paymentQrUrl: businessData.paymentQrUrl || "",
        flashDeal: businessData.flashDeal || "",
        instagramUrl: businessData.instagramUrl || "",
        facebookUrl: businessData.facebookUrl || ""
      });
    }
    if (userProfile) {
      setAccountInfo({
        name: userProfile.name || "",
        phone: userProfile.phone || "",
        houseNo: userProfile.houseNo || "",
        street: userProfile.street || "",
        landmark: userProfile.landmark || "",
        city: userProfile.city || "",
        state: userProfile.state || "Delhi",
        pincode: userProfile.pincode || "",
        country: userProfile.country || "India"
      });
    }
  }, [businessData, userProfile]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push("/login");
      else if (userProfile && userProfile.role !== "business") router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingAccount(true);
    const userRef = doc(firestore, "users", user.uid);
    updateDocumentNonBlocking(userRef, {
      name: accountInfo.name,
      phone: accountInfo.phone,
      houseNo: accountInfo.houseNo,
      street: accountInfo.street,
      landmark: accountInfo.landmark,
      city: accountInfo.city,
      state: accountInfo.state,
      pincode: accountInfo.pincode,
      country: accountInfo.country
    });
    toast({ title: "Account Updated", description: "Personal details successfully save ho gayi hain." });
    setIsUpdatingAccount(false);
  };

  const handleAIDescription = async () => {
    if (!newProduct.title) {
      toast({ variant: "destructive", title: "Wait!", description: "Please enter product name first." });
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await generateProductDescription({ 
        title: newProduct.title, 
        category: businessData?.category || 'General' 
      });
      setNewProduct(prev => ({ ...prev, description: res.description }));
      toast({ title: "AI Magic Done!", description: "Description generated successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "AI Error", description: err.message });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setShopProfile(prev => ({ ...prev, paymentQrUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setShopProfile(prev => ({ ...prev, shopLogoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setShopProfile(prev => ({ ...prev, shopImageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
      status: 'pending',
      badge: newProduct.badge || null,
      createdAt: new Date().toISOString()
    });
    toast({ title: "Product Submitted", description: "Admin approval ke liye bheja gaya hai." });
    setNewProduct({ title: "", price: "", description: "", imageUrl: "", badge: "" });
    setIsProductDialogOpen(false);
    setIsSubmittingProduct(false);
  };

  const handleUpdateShopProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    setDocumentNonBlocking(doc(firestore, "businesses", user.uid), {
      id: user.uid,
      ownerId: user.uid,
      shopName: shopProfile.shopName,
      category: shopProfile.shopCategory,
      description: shopProfile.shopDescription,
      contactNumber: shopProfile.shopContact,
      whatsappLink: `https://wa.me/${shopProfile.shopContact.replace(/\D/g, '')}`,
      imageUrl: shopProfile.shopImageUrl || "",
      logoUrl: shopProfile.shopLogoUrl || "",
      openingTime: shopProfile.openingTime,
      closingTime: shopProfile.closingTime,
      upiId: shopProfile.upiId,
      paymentQrUrl: shopProfile.paymentQrUrl,
      flashDeal: shopProfile.flashDeal,
      instagramUrl: shopProfile.instagramUrl,
      facebookUrl: shopProfile.facebookUrl,
    }, { merge: true });
    toast({ title: "Updated", description: "Shop details saved successfully." });
    setIsUpdatingProfile(false);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: "Reset Link Sent" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const qrUrl = origin && user?.uid 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(origin + '/business/' + user.uid)}`
    : null;

  const downloadQRCode = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shop-qr-${user?.uid}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "QR Code Downloaded" });
    } catch (err) {
      console.error("QR Download Error:", err);
      toast({ variant: "destructive", title: "Download failed", description: "QR code download nahi ho paya." });
    }
  };

  if (authLoading || loadingBusiness || loadingProducts || loadingOrders) {
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
        <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16 border-2 border-primary">
             <AvatarImage src={businessData?.logoUrl} className="object-cover" />
             <AvatarFallback className="bg-primary/10 text-primary font-black"><Store className="h-8 w-8" /></AvatarFallback>
           </Avatar>
           <div>
             <h1 className="text-3xl font-bold font-headline">{businessData?.shopName || "My Business"}</h1>
             <div className="flex items-center gap-2 mt-1">
               <Badge variant="outline" className="text-[10px] uppercase">{businessData?.category}</Badge>
               {hasPremium && <Badge className="bg-yellow-500 text-[10px]"><Crown className="h-3 w-3 mr-1" /> Premium</Badge>}
             </div>
           </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => typeof window !== 'undefined' && window.print()}><Printer className="mr-2 h-4 w-4" /> Flyer</Button>
           <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!hasPremium && products && products.length >= 3}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleAddProduct} className="space-y-4">
                <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Product Photo</Label>
                    <div className="flex flex-col gap-3">
                      {newProduct.imageUrl ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                          <Image src={newProduct.imageUrl} alt="Preview" fill className="object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setNewProduct(prev => ({ ...prev, imageUrl: "" }))}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-muted/50 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                          <Label htmlFor="product-image" className="cursor-pointer text-xs font-bold text-primary hover:underline">Select Photo</Label>
                          <Input id="product-image" type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Item Name</Label><Input required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>Highlight</Label>
                      <Select value={newProduct.badge} onValueChange={(v) => setNewProduct({ ...newProduct, badge: v })}>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="best-seller">Best Seller</SelectItem>
                          <SelectItem value="new">New Arrival</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                          <SelectItem value="sale">On Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center"><Label>Description</Label><Button type="button" variant="ghost" size="sm" className="text-primary h-6 text-xs" onClick={handleAIDescription} disabled={isGeneratingAI}><Sparkles className="h-3 w-3 mr-1" /> AI Write</Button></div>
                    <Textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                  </div>
                </div>
                <DialogFooter><Button type="submit" disabled={isSubmittingProduct} className="w-full">Submit</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Tabs defaultValue="inventory">
             <div className="flex items-center justify-between mb-4 border-b">
               <TabsList className="bg-transparent gap-4 overflow-x-auto no-scrollbar justify-start w-full">
                 <TabsTrigger value="inventory" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none">Inventory</TabsTrigger>
                 <TabsTrigger value="orders" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none">Orders</TabsTrigger>
                 <TabsTrigger value="marketing" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none">Marketing</TabsTrigger>
                 <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none">Shop Profile</TabsTrigger>
                 <TabsTrigger value="account" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent shadow-none">Personal Account</TabsTrigger>
               </TabsList>
             </div>

             <TabsContent value="inventory" className="space-y-6">
                {!products || products.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-xl opacity-50"><Package className="h-12 w-12 mx-auto mb-4" /><p>No items added yet.</p></div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {products.map((p) => (
                      <Card key={p.id} className="overflow-hidden">
                        <div className="relative aspect-video bg-muted">
                          <Image src={p.imageUrl || `https://picsum.photos/seed/p-${p.id}/400/300`} alt={p.title} fill className="object-cover" />
                          <div className="absolute top-2 left-2 flex gap-1">
                             {p.status === 'approved' ? <Badge className="bg-green-500">Live</Badge> : <Badge variant="secondary">Pending</Badge>}
                             {p.badge && <Badge className="bg-primary">{p.badge.toUpperCase()}</Badge>}
                          </div>
                        </div>
                        <CardHeader className="p-4 pb-0"><div className="flex justify-between font-bold"><span>{p.title}</span><span className="text-primary">₹{p.price}</span></div></CardHeader>
                        <CardFooter className="p-4 pt-4">
                          <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteDocumentNonBlocking(doc(firestore, "products", p.id))}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
             </TabsContent>

             <TabsContent value="orders" className="space-y-4">
                {!incomingOrders || incomingOrders.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-xl opacity-30"><Truck className="h-12 w-12 mx-auto mb-4" /><p>Abhi tak koi delivery order nahi aaya.</p></div>
                ) : (
                  <div className="space-y-4">
                    {incomingOrders.map(order => (
                      <Card key={order.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-lg">{order.productTitle}</CardTitle>
                            <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="uppercase text-[9px]">{order.status}</Badge>
                          </div>
                          <CardDescription className="flex items-center gap-1 font-bold text-primary"><UserCircle className="h-3 w-3" /> Customer: {order.customerName} ({order.customerDeliveryId})</CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                          <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.address}</p>
                          {order.deliveryBoyName && (
                            <div className="p-2 bg-muted rounded-lg flex items-center justify-between">
                               <span className="font-bold flex items-center gap-1"><Truck className="h-3 w-3" /> Picked by: {order.deliveryBoyName}</span>
                               <Button variant="ghost" size="sm" className="h-6 text-[10px]" asChild><a href={`tel:${order.deliveryBoyPhone}`}>Call Rider</a></Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
             </TabsContent>

             <TabsContent value="marketing" className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Flash Deal</CardTitle></CardHeader>
                    <CardContent className="space-y-4"><Input placeholder="e.g. 20% off for next 2 hours!" value={shopProfile.flashDeal} onChange={(e) => setShopProfile({...shopProfile, flashDeal: e.target.value})} /><Button size="sm" className="w-full" onClick={() => handleUpdateShopProfile()}>Activate</Button></CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-500" /> Payments</CardTitle></CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <Input placeholder="UPI ID" value={shopProfile.upiId} onChange={(e) => setShopProfile({...shopProfile, upiId: e.target.value})} />
                      <Label htmlFor="qr-upload" className="flex items-center justify-center gap-2 h-9 border rounded-md bg-white cursor-pointer text-xs font-bold"><Upload className="h-3 w-3" /> QR Image</Label>
                      <Input type="file" accept="image/*" className="hidden" id="qr-upload" onChange={handleQrUpload} />
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateShopProfile()}>Save Payment</Button>
                    </CardContent>
                  </Card>
                </div>
             </TabsContent>

             <TabsContent value="settings" className="space-y-6">
               <Card>
                 <CardHeader><CardTitle>Shop Branding & Details</CardTitle></CardHeader>
                 <CardContent>
                    <form onSubmit={handleUpdateShopProfile} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-muted-foreground">Logo</Label>
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border">
                              <AvatarImage src={shopProfile.shopLogoUrl} className="object-cover" />
                              <AvatarFallback><Store /></AvatarFallback>
                            </Avatar>
                            <Label htmlFor="logo-upload" className="cursor-pointer text-xs font-bold text-primary bg-primary/5 p-2 rounded-lg"><Upload className="h-3 w-3 inline mr-1" /> Change Logo</Label>
                            <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase text-muted-foreground">Banner</Label>
                          <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted">
                            {shopProfile.shopImageUrl && <Image src={shopProfile.shopImageUrl} alt="Banner" fill className="object-cover" />}
                            <Label htmlFor="banner-upload" className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-[10px] font-bold shadow-lg cursor-pointer"><ImageIcon className="h-3 w-3 inline mr-1" /> Update Banner</Label>
                            <Input id="banner-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Shop Name</Label><Input value={shopProfile.shopName} onChange={(e) => setShopProfile({...shopProfile, shopName: e.target.value})} /></div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={shopProfile.shopCategory} onValueChange={(v: BusinessCategory) => setShopProfile({...shopProfile, shopCategory: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Shop Description</Label><Textarea value={shopProfile.shopDescription} onChange={(e) => setShopProfile({...shopProfile, shopDescription: e.target.value})} /></div>
                      <Button type="submit" className="w-full" disabled={isUpdatingProfile}>Save Shop Profile</Button>
                    </form>
                 </CardContent>
               </Card>
             </TabsContent>

             <TabsContent value="account" className="space-y-6">
               <Card>
                 <CardHeader><CardTitle>Personal Account Details</CardTitle></CardHeader>
                 <CardContent>
                   <form onSubmit={handleUpdateAccount} className="space-y-6">
                     <div className="grid sm:grid-cols-2 gap-4">
                       <div className="space-y-2"><Label>Full Name</Label><Input value={accountInfo.name} onChange={(e) => setAccountInfo({...accountInfo, name: e.target.value})} /></div>
                       <div className="space-y-2"><Label>Phone Number</Label><Input value={accountInfo.phone} onChange={(e) => setAccountInfo({...accountInfo, phone: e.target.value})} /></div>
                     </div>
                     <div className="space-y-4 pt-4 border-t">
                       <div className="flex items-center gap-2 pb-2"><Building2 className="h-4 w-4 text-primary" /><span className="text-sm font-black uppercase tracking-tight">Structured Address</span></div>
                       <div className="grid sm:grid-cols-2 gap-4">
                         <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">House No</Label><Input value={accountInfo.houseNo} onChange={(e) => setAccountInfo({...accountInfo, houseNo: e.target.value})} className="rounded-xl" /></div>
                         <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">Street</Label><Input value={accountInfo.street} onChange={(e) => setAccountInfo({...accountInfo, street: e.target.value})} className="rounded-xl" /></div>
                       </div>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                         <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">City</Label><Input value={accountInfo.city} onChange={(e) => setAccountInfo({...accountInfo, city: e.target.value})} className="rounded-xl" /></div>
                         <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">Pincode</Label><Input value={accountInfo.pincode} onChange={(e) => setAccountInfo({...accountInfo, pincode: e.target.value})} className="rounded-xl" /></div>
                         <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">State</Label>
                           <Select value={accountInfo.state} onValueChange={(v) => setAccountInfo({...accountInfo, state: v})}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{stateList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                         </div>
                       </div>
                     </div>
                     <Button type="submit" className="w-full gap-2 font-bold" disabled={isUpdatingAccount}>{isUpdatingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Personal Changes</Button>
                   </form>
                 </CardContent>
               </Card>
               <Card className="border-destructive/20 bg-destructive/5">
                 <CardHeader><CardTitle className="text-destructive text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> Account Security</CardTitle></CardHeader>
                 <CardContent className="flex items-center justify-between">
                   <p className="text-xs text-muted-foreground">Hum aapke email par password reset link bhejenge.</p>
                   <Button variant="outline" size="sm" onClick={handlePasswordReset} disabled={isResettingPassword} className="font-black text-[10px] uppercase">{isResettingPassword ? "Sending..." : "Reset Password"}</Button>
                 </CardContent>
               </Card>
             </TabsContent>
           </Tabs>
        </div>

        <div className="space-y-8">
           <Card className="border-primary/20 bg-primary/5">
             <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Live Insights</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-3 rounded-lg shadow-sm border text-center"><p className="text-[10px] uppercase font-bold text-muted-foreground">Views</p><p className="text-xl font-black">{businessData?.views || 0}</p></div>
                   <div className="bg-white p-3 rounded-lg shadow-sm border text-center"><p className="text-[10px] uppercase font-bold text-muted-foreground">Leads</p><p className="text-xl font-black">{(businessData?.callCount || 0) + (businessData?.whatsappCount || 0)}</p></div>
                </div>
             </CardContent>
           </Card>
           <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl">
             <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Rocket className="h-4 w-4" /> Marketing Kit</CardTitle></CardHeader>
             <CardContent className="space-y-4">
               <div className="aspect-square bg-white rounded-xl flex items-center justify-center p-4">
                 {qrUrl ? <Image src={qrUrl} alt="QR Code" width={200} height={200} /> : <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded-lg" />}
               </div>
               <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold" onClick={downloadQRCode}><Download className="h-4 w-4 mr-2" /> Download QR</Button>
               <Button variant="ghost" className="w-full text-white hover:bg-white/10" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Swagat hai hamari dukan ' + shopProfile.shopName + ' par! Online dekhein: ' + origin + '/business/' + user?.uid)}`, '_blank')}><MessageCircle className="h-4 w-4 mr-2" /> WhatsApp Status</Button>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
