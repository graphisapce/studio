export type BusinessCategory = 'Food' | 'Services' | 'Retail' | 'Repairs';

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
  latitude: number;
  longitude: number;
}

export interface Product {
  id: string;
  businessId: string;
  title: string;
  price: number;
  description: string;
  imageUrl: string;
  imageHint: string;
}
