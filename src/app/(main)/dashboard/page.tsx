
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
  MapPin,
  Crown,
  CheckCircle2,
  CalendarDays,
  ShieldCheck,
  Clock,
  XCircle,
  Eye,
  TrendingUp,
  Sparkles,
  Camera,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  QrCode,
  CreditCard,
  Zap,
  Download,
  Instagram,
  Facebook,
  Share2,
  Upload
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
import { generateProductDescription } from "@/ai/flows/generate-description-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const businessRef = useMemoFirebase(() => user ? doc(firestore, "businesses", user.uid) : null, [firestore, user]);
  const { data: businessData, isLoading: loadingBusiness } = useDoc<Business>(businessRef);

  const productsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, "products"), where("businessId", "==", user.uid)) : null, 
    [firestore, user]
  );
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsQuery);

  const [newProduct, setNewProduct] = useState({ title: "", price: "", description: "", imageUrl: "" });
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
  const [addressParts, setAddressParts] = useState({ region: "India", state: "", city: "", street: "", landmark: "", pincode: "" });

  const hasPremium = isBusinessPremium(businessData);

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
      imageHint: 'product',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    toast({ title: "Product Submitted", description: "Your item is pending admin approval." });
    setNewProduct({ title: "", price: "", description: "", imageUrl: "" });
    setIsProductDialogOpen(false);
    setIsSubmittingProduct(false);
  };

  const handleUpdateShopProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      logoUrl: shopProfile.shopLogoUrl || "",
      openingTime: shopProfile.openingTime,
      closingTime: shopProfile.closingTime,
      upiId: shopProfile.upiId,
      paymentQrUrl: shopProfile.paymentQrUrl,
      flashDeal: shopProfile.flashDeal,
      instagramUrl: shopProfile.instagramUrl,
      facebookUrl: shopProfile.facebookUrl,
      isPaid: businessData?.isPaid || false,
      premiumUntil: businessData?.premiumUntil || null,
      premiumStatus: businessData?.premiumStatus || 'none'
    }, { merge: true });
    toast({ title: "Updated", description: "Shop details saved successfully." });
    setIsUpdatingProfile(false);
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
        <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16 border-2 border-primary">
             <AvatarImage src={businessData?.logoUrl} />
             <AvatarFallback className="bg-primary/10 text-primary"><Store className="h-8 w-8" /></AvatarFallback>
           </Avatar>
           <div>
             <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
               {businessData?.shopName || "My Business"}
             </h1>
             <div className="flex flex-wrap items-center gap-2 mt-1">
               <p className="text-muted-foreground text-sm">Manage your digital storefront</p>
               {hasPremium && (
                 <Badge className="bg-yellow-500 flex gap-1 text-[10px]">
                   <Crown className="h-3 w-3" /> Premium Active
                 </Badge>
               )}
             </div>
           </div>
        </div>

        <div className="flex gap-2">
           <Dialog>
             <DialogTrigger asChild>
               <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                 <QrCode className="mr-2 h-4 w-4" /> Shop QR
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-xs text-center">
               <DialogHeader>
                 <DialogTitle>Your Shop QR Code</DialogTitle>
                 <DialogDescription>Customers can scan this to visit your digital shop.</DialogDescription>
               </DialogHeader>
               <div className="p-6 bg-white rounded-xl border shadow-sm mx-auto">
                  <div className="w-48 h-48 bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary rounded-lg relative overflow-hidden">
                    <QrCode className="h-32 w-32 text-primary opacity-20" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <p className="text-[10px] font-bold text-primary mb-1">{businessData?.shopName}</p>
                      <Image 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/business/' + user?.uid)}`} 
                        alt="Shop QR" 
                        width={150} 
                        height={150} 
                        className="rounded-md shadow-md"
                      />
                    </div>
                  </div>
               </div>
               <Button className="w-full mt-4" onClick={() => window.print()}>
                 <Download className="mr-2 h-4 w-4" /> Print for Shop
               </Button>
             </DialogContent>
           </Dialog>

           <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                    <Input id="title" required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} placeholder="e.g. Special Thali" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="desc">Description</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] text-primary hover:bg-primary/10" onClick={handleAIDescription} disabled={isGeneratingAI}>
                        {isGeneratingAI ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        AI Write
                      </Button>
                    </div>
                    <Textarea id="desc" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Tell customers about your item..." />
                  </div>
                  <div className="grid gap-2">
                    <Label>Product Image</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setNewProduct({ ...newProduct, imageUrl: b }))} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmittingProduct} className="w-full">
                    {isSubmittingProduct ? "Publishing..." : "Submit for Approval"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><Eye className="h-3 w-3" /> Profile Views</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-black">{businessData?.views || 0}</p></CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200/50">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Live Items</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-2xl font-black">{products?.filter(p => p.status === 'approved').length || 0}</p></CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-200/50">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><CreditCard className="h-3 w-3" /> Direct Pay</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-lg font-bold truncate">{businessData?.upiId || "Not Setup"}</p></CardContent>
        </Card>
        <Card className="bg-yellow-50/50 border-yellow-200/50">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2"><Zap className="h-3 w-3" /> Active Offer</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0"><p className="text-lg font-bold truncate">{businessData?.flashDeal || "None"}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="listings">Your Listings</TabsTrigger>
          <TabsTrigger value="growth">Marketing Tools</TabsTrigger>
          <TabsTrigger value="profile">Shop Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <Card>
            <CardHeader><CardTitle>Inventory</CardTitle></CardHeader>
            <CardContent>
              {!products || products.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p>No items found. Start by adding your first product.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((p) => {
                    const prodImg = (typeof p.imageUrl === 'string' && p.imageUrl.trim() !== "")
                      ? p.imageUrl 
                      : `https://picsum.photos/seed/prod-${p.id}/400/300`;
                    
                    return (
                      <Card key={p.id} className="overflow-hidden group relative">
                        <div className="absolute top-2 left-2 z-10">
                          {p.status === 'approved' ? (
                            <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>
                          ) : p.status === 'rejected' ? (
                            <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </div>
                        <div className="relative aspect-video bg-muted">
                          <Image src={prodImg} alt={p.title || "Product"} fill className="object-cover" />
                        </div>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between font-bold">
                            <span>{p.title}</span>
                            <span className="text-primary">₹{p.price}</span>
                          </div>
                        </CardHeader>
                        <CardFooter className="p-4 pt-0">
                          <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteDocumentNonBlocking(doc(firestore, "products", p.id))}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
           <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /> Live Flash Deal</CardTitle>
                  <CardDescription>Appears on the homepage for customers within 1km.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Flash Deal Text (Short & Catchy)</Label>
                    <Input placeholder="e.g. 20% Discount on Pizza today!" value={shopProfile.flashDeal} onChange={(e) => setShopProfile({...shopProfile, flashDeal: e.target.value})} />
                  </div>
                  <Button className="w-full" onClick={() => handleUpdateShopProfile()}>Update Live Offer</Button>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-blue-500" /> Direct UPI Payment & QR</CardTitle>
                  <CardDescription>Enable customers to pay you directly via UPI or QR.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your UPI ID (VPA)</Label>
                    <Input placeholder="e.g. name@okaxis" value={shopProfile.upiId} onChange={(e) => setShopProfile({...shopProfile, upiId: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment QR Image (GPay/PhonePe)</Label>
                    {shopProfile.paymentQrUrl && (
                      <div className="relative w-32 h-32 mb-2 border rounded-lg overflow-hidden">
                        <Image src={shopProfile.paymentQrUrl} alt="Payment QR" fill className="object-contain" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setShopProfile({...shopProfile, paymentQrUrl: b}))} />
                    </div>
                  </div>
                  {hasPremium ? (
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateShopProfile()}>Save Payment Details</Button>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg text-center opacity-70">
                       <p className="text-xs font-bold text-muted-foreground flex items-center justify-center gap-2"><Crown className="h-3 w-3" /> Payment Tools are Premium Features</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="md:col-span-2 border-purple-200 bg-purple-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-purple-600" /> Social Media & Links</CardTitle>
                  <CardDescription>Boost your trust by linking your social profiles.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Instagram className="h-4 w-4 text-pink-600" /> Instagram Link</Label>
                    <Input placeholder="https://instagram.com/yourshop" value={shopProfile.instagramUrl} onChange={(e) => setShopProfile({...shopProfile, instagramUrl: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" /> Facebook Link</Label>
                    <Input placeholder="https://facebook.com/yourshop" value={shopProfile.facebookUrl} onChange={(e) => setShopProfile({...shopProfile, facebookUrl: e.target.value})} />
                  </div>
                  <Button className="sm:col-span-2 w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateShopProfile()}>Save Social Profiles</Button>
                </CardContent>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="max-w-4xl mx-auto">
            <CardHeader><CardTitle>Shop Profile Settings</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateShopProfile} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 border-2 border-dashed border-primary">
                        <AvatarImage src={shopProfile.shopLogoUrl} />
                        <AvatarFallback><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                      </Avatar>
                      <Input type="file" accept="image/*" className="max-w-[150px]" onChange={(e) => handleFileChange(e, (b) => setShopProfile({...shopProfile, shopLogoUrl: b}))} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label>Banner</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (b) => setShopProfile({...shopProfile, shopImageUrl: b}))} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Shop Name</Label><Input value={shopProfile.shopName} onChange={(e) => setShopProfile({...shopProfile, shopName: e.target.value})} /></div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={shopProfile.shopCategory} onValueChange={(v: BusinessCategory) => setShopProfile({...shopProfile, shopCategory: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label>Contact Number</Label><Input value={shopProfile.shopContact} onChange={(e) => setShopProfile({...shopProfile, shopContact: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Opening Time</Label><Input type="time" value={shopProfile.openingTime} onChange={(e) => setShopProfile({...shopProfile, openingTime: e.target.value})} /></div>
                </div>

                <div className="space-y-2"><Label>Description</Label><Textarea value={shopProfile.shopDescription} onChange={(e) => setShopProfile({...shopProfile, shopDescription: e.target.value})} /></div>
                
                <div className="space-y-6 border-t pt-8">
                  <h3 className="font-bold flex gap-2 items-center text-primary"><MapPin className="h-5 w-5" /> Location Address</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select value={addressParts.state} onValueChange={(v) => setAddressParts({...addressParts, state: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>City</Label><Input value={addressParts.city} onChange={(e) => setAddressParts({...addressParts, city: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Street / Area</Label><Input value={addressParts.street} onChange={(e) => setAddressParts({...addressParts, street: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Pincode</Label><Input value={addressParts.pincode} onChange={(e) => setAddressParts({...addressParts, pincode: e.target.value})} /></div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-black" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? "Saving..." : "Save Shop Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
