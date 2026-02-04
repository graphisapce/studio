
export type BusinessCategory = 
  | 'Food' 
  | 'Groceries' 
  | 'Retail' 
  | 'Electronics' 
  | 'Repairs' 
  | 'Services' 
  | 'Beauty' 
  | 'Health' 
  | 'Education' 
  | 'Automobile' 
  | 'Gifts' 
  | 'Home Decor' 
  | 'Clothing' 
  | 'Jewelry' 
  | 'Hardware' 
  | 'Pharmacy' 
  | 'Stationery' 
  | 'Advocate'
  | 'Loha Welding'
  | 'Bike Seat Cover'
  | 'Bike Repair'
  | 'Car Repair'
  | 'Car Painter'
  | 'Others';

export type UserRole = 'customer' | 'business' | 'admin' | 'moderator' | 'delivery-boy';

export interface Business {
  id: string;
  ownerId: string;
  shopName: string;
  category: BusinessCategory;
  address: string;
  contactNumber: string;
  whatsappLink: string;
  imageUrl: string;
  logoUrl?: string;
  imageHint: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  isPaid?: boolean;
  premiumStatus?: 'active' | 'pending' | 'expired' | 'none';
  premiumUntil?: string | null;
  lastTransactionId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  views?: number;
  callCount?: number;
  whatsappCount?: number;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  openingTime?: string;
  closingTime?: string;
  upiId?: string;
  paymentQrUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  flashDeal?: string;
  flashDealExpiry?: string;
}

export interface Product {
  id: string;
  businessId: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  imageHint: string;
  status: 'pending' | 'approved' | 'rejected';
  badge?: 'best-seller' | 'new' | 'limited' | 'sale';
  createdAt?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerDeliveryId: string;
  customerPhone?: string;
  businessId: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  productId: string;
  productTitle: string;
  price: number;
  deliveryBoyId?: string;
  deliveryBoyName?: string;
  deliveryBoyPhone?: string;
  status: 'pending' | 'assigned' | 'picked-up' | 'out-for-delivery' | 'delivered' | 'cancelled';
  address: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  favorites?: string[]; 
  deliveryId?: string;
  areaCode?: string;
  houseNo?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PlatformConfig {
  announcement?: string;
  isMaintenance?: boolean;
  lastUpdated?: string;
}
