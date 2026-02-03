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
  | 'Others';

export interface Business {
  id: string;
  ownerId: string;
  shopName: string;
  category: BusinessCategory;
  address: string;
  contactNumber: string;
  whatsappLink: string;
  imageUrl: string;
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
  rating?: number;
  reviewCount?: number;
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
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: 'customer' | 'business' | 'admin';
  createdAt: string;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface PlatformConfig {
  announcement?: string;
  isMaintenance?: boolean;
}
