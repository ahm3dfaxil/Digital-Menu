export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  restaurantId: string;
  createdAt: string;
  role?: "Admin" | "User";
  status?: "Active" | "Suspended";
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  logo: string;
  banner: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  openingHours: string;
  themeColor: string; // e.g. hex color '#8b5cf6'
  currency: string;   // e.g. 'USD', 'EUR', 'INR'
  language: string;   // e.g. 'en', 'es', 'fr'
  createdAt: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  displayOrder: number;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  veg: boolean;
  bestseller: boolean;
  available: boolean;
  createdAt: string;
}
