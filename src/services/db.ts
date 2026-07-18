import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db, isConfigValid } from "../firebase/config";
import type { Category, MenuItem, Restaurant, UserProfile } from "../types";

// ==========================================
// MOCK DATA STORAGE & SUBSCRIPTION SYSTEM
// ==========================================
const MOCK_CATEGORIES_KEY = "menuflow_mock_categories";
const MOCK_MENUITEMS_KEY = "menuflow_mock_menuitems";

// Mock database listeners
const categoryListeners: { [restaurantId: string]: Set<(categories: Category[]) => void> } = {};
const menuItemListeners: { [restaurantId: string]: Set<(items: MenuItem[]) => void> } = {};

const triggerCategoryListeners = (restaurantId: string) => {
  const categories = getMockCategories(restaurantId);
  if (categoryListeners[restaurantId]) {
    categoryListeners[restaurantId].forEach(listener => listener(categories));
  }
};

const triggerMenuItemListeners = (restaurantId: string) => {
  const items = getMockMenuItems(restaurantId);
  if (menuItemListeners[restaurantId]) {
    menuItemListeners[restaurantId].forEach(listener => listener(items));
  }
};

const getMockCategories = (restaurantId: string): Category[] => {
  const data = localStorage.getItem(MOCK_CATEGORIES_KEY);
  if (!data) {
    // Seed default categories
    const defaults: Category[] = [
      { id: "cat1", restaurantId, name: "Popular Items", displayOrder: 0, createdAt: new Date().toISOString() },
      { id: "cat2", restaurantId, name: "Burgers & Sandwiches", displayOrder: 1, createdAt: new Date().toISOString() },
      { id: "cat3", restaurantId, name: "Desserts & Shakes", displayOrder: 2, createdAt: new Date().toISOString() },
      { id: "cat4", restaurantId, name: "Beverages", displayOrder: 3, createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify(defaults));
    return defaults;
  }
  const parsed = JSON.parse(data) as Category[];
  return parsed.filter(c => c.restaurantId === restaurantId).sort((a, b) => a.displayOrder - b.displayOrder);
};

const getMockMenuItems = (restaurantId: string): MenuItem[] => {
  const data = localStorage.getItem(MOCK_MENUITEMS_KEY);
  if (!data) {
    // Seed default menu items
    const defaults: MenuItem[] = [
      {
        id: "item1",
        restaurantId,
        categoryId: "cat1",
        name: "Classic Cheeseburger",
        description: "Juicy angus beef patty, melted cheddar, lettuce, tomato, house special sauce on a toasted brioche bun.",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60",
        veg: false,
        bestseller: true,
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "item2",
        restaurantId,
        categoryId: "cat1",
        name: "Truffle Parmesan Fries",
        description: "Golden crispy skin-on fries tossed in white truffle oil, grated parmesan cheese, and fresh parsley. Served with garlic aioli.",
        price: 8.49,
        image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60",
        veg: true,
        bestseller: true,
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "item3",
        restaurantId,
        categoryId: "cat2",
        name: "Avocado Garden Club",
        description: "Smashed fresh avocado, swiss cheese, heirloom tomatoes, alfalfa sprouts, and cucumber on toasted sourdough bread.",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=400&auto=format&fit=crop&q=60",
        veg: true,
        bestseller: false,
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "item4",
        restaurantId,
        categoryId: "cat3",
        name: "Molten Chocolate Lava Cake",
        description: "Warm, rich chocolate cake with a gooey liquid chocolate center. Served with a scoop of Madagascar vanilla bean ice cream.",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=60",
        veg: true,
        bestseller: true,
        available: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "item5",
        restaurantId,
        categoryId: "cat4",
        name: "Iced Caramel Macchiato",
        description: "Freshly pulled shots of espresso combined with creamy milk, vanilla syrup, and a rich caramel drizzle over ice.",
        price: 5.49,
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=60",
        veg: true,
        bestseller: false,
        available: true,
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(MOCK_MENUITEMS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  const parsed = JSON.parse(data) as MenuItem[];
  return parsed.filter(i => i.restaurantId === restaurantId);
};

// ==========================================
// RESTAURANT DB SERVICES
// ==========================================

export const updateRestaurant = async (restaurantId: string, updates: Partial<Restaurant>): Promise<void> => {
  if (!isConfigValid) {
    const data = localStorage.getItem("menuflow_mock_restaurant");
    if (data) {
      const rest = JSON.parse(data) as Restaurant;
      if (rest.id === restaurantId) {
        const updated = { ...rest, ...updates };
        localStorage.setItem("menuflow_mock_restaurant", JSON.stringify(updated));
      }
    }
    return;
  }
  const ref = doc(db, "restaurants", restaurantId);
  await updateDoc(ref, updates);
};

export const getRestaurantPublic = async (restaurantId: string): Promise<Restaurant | null> => {
  if (!isConfigValid) {
    const data = localStorage.getItem("menuflow_mock_restaurant");
    if (data) {
      const rest = JSON.parse(data) as Restaurant;
      if (rest.id === restaurantId) return rest;
    }
    return null;
  }
  const ref = doc(db, "restaurants", restaurantId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Restaurant) : null;
};

// ==========================================
// CATEGORY DB SERVICES
// ==========================================

export const subscribeCategories = (restaurantId: string, callback: (categories: Category[]) => void) => {
  if (!isConfigValid) {
    if (!categoryListeners[restaurantId]) {
      categoryListeners[restaurantId] = new Set();
    }
    categoryListeners[restaurantId].add(callback);
    // Trigger initial load
    callback(getMockCategories(restaurantId));
    return () => {
      categoryListeners[restaurantId].delete(callback);
    };
  }

  const q = query(
    collection(db, "categories"), 
    where("restaurantId", "==", restaurantId),
    orderBy("displayOrder", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const categories: Category[] = [];
    snapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() } as Category);
    });
    callback(categories);
  });
};

export const createCategory = async (restaurantId: string, name: string, displayOrder: number): Promise<string> => {
  if (!isConfigValid) {
    const categories = getMockCategories(restaurantId);
    const newCategory: Category = {
      id: "cat_" + Date.now(),
      restaurantId,
      name,
      displayOrder,
      createdAt: new Date().toISOString()
    };
    categories.push(newCategory);
    // Sort just in case
    categories.sort((a, b) => a.displayOrder - b.displayOrder);
    // Write back entire database (including other restaurants)
    const allData = localStorage.getItem(MOCK_CATEGORIES_KEY);
    const otherCats = allData ? (JSON.parse(allData) as Category[]).filter(c => c.restaurantId !== restaurantId) : [];
    localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify([...otherCats, ...categories]));
    triggerCategoryListeners(restaurantId);
    return newCategory.id;
  }

  const ref = collection(db, "categories");
  const docRef = await addDoc(ref, {
    restaurantId,
    name,
    displayOrder,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateCategory = async (restaurantId: string, categoryId: string, name: string): Promise<void> => {
  if (!isConfigValid) {
    const allData = localStorage.getItem(MOCK_CATEGORIES_KEY);
    if (allData) {
      const parsed = JSON.parse(allData) as Category[];
      const idx = parsed.findIndex(c => c.id === categoryId);
      if (idx !== -1) {
        parsed[idx].name = name;
        localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify(parsed));
        triggerCategoryListeners(restaurantId);
      }
    }
    return;
  }
  const ref = doc(db, "categories", categoryId);
  await updateDoc(ref, { name });
};

export const deleteCategory = async (restaurantId: string, categoryId: string): Promise<void> => {
  if (!isConfigValid) {
    // Delete category
    const allData = localStorage.getItem(MOCK_CATEGORIES_KEY);
    if (allData) {
      const parsed = JSON.parse(allData) as Category[];
      const filtered = parsed.filter(c => c.id !== categoryId);
      localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify(filtered));
      triggerCategoryListeners(restaurantId);
    }
    // Delete associated menu items
    const allItems = localStorage.getItem(MOCK_MENUITEMS_KEY);
    if (allItems) {
      const parsed = JSON.parse(allItems) as MenuItem[];
      const filtered = parsed.filter(i => i.categoryId !== categoryId);
      localStorage.setItem(MOCK_MENUITEMS_KEY, JSON.stringify(filtered));
      triggerMenuItemListeners(restaurantId);
    }
    return;
  }

  // Delete from category collection
  await deleteDoc(doc(db, "categories", categoryId));
  
  // NOTE: Items cleanup can be done client-side or we can delete associated items. 
  // For safety and database consistency, let's delete items under this category too in Menu Management.
};

export const reorderCategories = async (restaurantId: string, categoriesList: Category[]): Promise<void> => {
  if (!isConfigValid) {
    const allData = localStorage.getItem(MOCK_CATEGORIES_KEY);
    if (allData) {
      const parsed = JSON.parse(allData) as Category[];
      // Remove current restaurant categories
      const filtered = parsed.filter(c => c.restaurantId !== restaurantId);
      // Re-map with new order
      const reordered = categoriesList.map((cat, index) => ({
        ...cat,
        displayOrder: index
      }));
      localStorage.setItem(MOCK_CATEGORIES_KEY, JSON.stringify([...filtered, ...reordered]));
      triggerCategoryListeners(restaurantId);
    }
    return;
  }

  const batch = writeBatch(db);
  categoriesList.forEach((cat, index) => {
    const ref = doc(db, "categories", cat.id);
    batch.update(ref, { displayOrder: index });
  });
  await batch.commit();
};

// ==========================================
// MENU ITEM DB SERVICES
// ==========================================

export const subscribeMenuItems = (restaurantId: string, callback: (items: MenuItem[]) => void) => {
  if (!isConfigValid) {
    if (!menuItemListeners[restaurantId]) {
      menuItemListeners[restaurantId] = new Set();
    }
    menuItemListeners[restaurantId].add(callback);
    callback(getMockMenuItems(restaurantId));
    return () => {
      menuItemListeners[restaurantId].delete(callback);
    };
  }

  const q = query(
    collection(db, "menuItems"), 
    where("restaurantId", "==", restaurantId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const items: MenuItem[] = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as MenuItem);
    });
    callback(items);
  });
};

export const createMenuItem = async (restaurantId: string, itemData: Omit<MenuItem, "id" | "restaurantId" | "createdAt">): Promise<string> => {
  if (!isConfigValid) {
    const items = getMockMenuItems(restaurantId);
    const newItem: MenuItem = {
      id: "item_" + Date.now(),
      restaurantId,
      ...itemData,
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    
    const allData = localStorage.getItem(MOCK_MENUITEMS_KEY);
    const otherItems = allData ? (JSON.parse(allData) as MenuItem[]).filter(i => i.restaurantId !== restaurantId) : [];
    localStorage.setItem(MOCK_MENUITEMS_KEY, JSON.stringify([...otherItems, ...items]));
    triggerMenuItemListeners(restaurantId);
    return newItem.id;
  }

  const ref = collection(db, "menuItems");
  const docRef = await addDoc(ref, {
    restaurantId,
    ...itemData,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
};

export const updateMenuItem = async (restaurantId: string, itemId: string, itemData: Partial<Omit<MenuItem, "id" | "restaurantId" | "createdAt">>): Promise<void> => {
  if (!isConfigValid) {
    const allData = localStorage.getItem(MOCK_MENUITEMS_KEY);
    if (allData) {
      const parsed = JSON.parse(allData) as MenuItem[];
      const idx = parsed.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        parsed[idx] = { ...parsed[idx], ...itemData };
        localStorage.setItem(MOCK_MENUITEMS_KEY, JSON.stringify(parsed));
        triggerMenuItemListeners(restaurantId);
      }
    }
    return;
  }
  const ref = doc(db, "menuItems", itemId);
  await updateDoc(ref, itemData);
};

export const deleteMenuItem = async (restaurantId: string, itemId: string): Promise<void> => {
  if (!isConfigValid) {
    const allData = localStorage.getItem(MOCK_MENUITEMS_KEY);
    if (allData) {
      const parsed = JSON.parse(allData) as MenuItem[];
      const filtered = parsed.filter(i => i.id !== itemId);
      localStorage.setItem(MOCK_MENUITEMS_KEY, JSON.stringify(filtered));
      triggerMenuItemListeners(restaurantId);
    }
    return;
  }
  const ref = doc(db, "menuItems", itemId);
  await deleteDoc(ref);
};

// ==========================================
// SEED DATA & ADMIN OPERATION SYSTEM
// ==========================================

const SEED_USERS: UserProfile[] = [
  {
    uid: "demo_user_123",
    name: "Demo Owner",
    email: "demo@menuflow.com",
    restaurantId: "demo_user_123_restaurant",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    role: "Admin",
    status: "Active"
  },
  {
    uid: "mock_owner_alex",
    name: "Alex Bistro",
    email: "alex@bistro.com",
    restaurantId: "mock_owner_alex_restaurant",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    role: "User",
    status: "Active"
  },
  {
    uid: "mock_owner_sarah",
    name: "Sarah Pizza",
    email: "sarah@pizzaplanet.com",
    restaurantId: "mock_owner_sarah_restaurant",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    role: "User",
    status: "Active"
  },
  {
    uid: "mock_owner_kenji",
    name: "Kenji Sato",
    email: "kenji@sushigarden.com",
    restaurantId: "mock_owner_kenji_restaurant",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    role: "User",
    status: "Active"
  },
  {
    uid: "mock_owner_elena",
    name: "Elena Petrova",
    email: "elena@sweetbites.com",
    restaurantId: "mock_owner_elena_restaurant",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    role: "User",
    status: "Suspended"
  }
];

const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: "demo_user_123_restaurant",
    ownerId: "demo_user_123",
    name: "Delicious Bistro",
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
    address: "123 Gourmet Street, Foodville",
    phone: "+1 (555) 123-4567",
    email: "demo@menuflow.com",
    website: "https://deliciousbistro.com",
    openingHours: "Mon - Sun: 09:00 AM - 10:00 PM",
    themeColor: "#8b5cf6",
    currency: "USD",
    language: "en",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "mock_owner_alex_restaurant",
    ownerId: "mock_owner_alex",
    name: "Alex Bistro Cafe",
    logo: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=1200&auto=format&fit=crop&q=80",
    address: "456 Cafe Avenue, Paris",
    phone: "+33 1 42 68 53 00",
    email: "alex@bistro.com",
    website: "https://alexbistrocafe.com",
    openingHours: "Tue - Sun: 08:00 AM - 08:00 PM",
    themeColor: "#0ea5e9",
    currency: "EUR",
    language: "fr",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "mock_owner_sarah_restaurant",
    ownerId: "mock_owner_sarah",
    name: "Pizza Planet",
    logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=1200&auto=format&fit=crop&q=80",
    address: "789 Orbit Way, Space City",
    phone: "+1 (555) 987-6543",
    email: "sarah@pizzaplanet.com",
    website: "https://pizzaplanet.space",
    openingHours: "Mon - Sun: 11:00 AM - 11:00 PM",
    themeColor: "#ef4444",
    currency: "USD",
    language: "en",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "mock_owner_kenji_restaurant",
    ownerId: "mock_owner_kenji",
    name: "Sushi Garden",
    logo: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&auto=format&fit=crop&q=80",
    address: "321 Bonsai Drive, Tokyo",
    phone: "+81 3 5555 5555",
    email: "kenji@sushigarden.com",
    website: "https://sushigarden.jp",
    openingHours: "Mon - Sat: 12:00 PM - 10:00 PM",
    themeColor: "#10b981",
    currency: "JPY",
    language: "en",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "mock_owner_elena_restaurant",
    ownerId: "mock_owner_elena",
    name: "Sweet Bites Bakery",
    logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=60",
    banner: "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=1200&auto=format&fit=crop&q=80",
    address: "741 Sugar Boulevard, Vienna",
    phone: "+43 1 71154",
    email: "elena@sweetbites.com",
    website: "https://sweetbitesbakery.at",
    openingHours: "Daily: 07:00 AM - 06:00 PM",
    themeColor: "#ec4899",
    currency: "EUR",
    language: "en",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_CATEGORIES: Category[] = [
  { id: "cat1", restaurantId: "demo_user_123_restaurant", name: "Popular Items", displayOrder: 0, createdAt: new Date().toISOString() },
  { id: "cat2", restaurantId: "demo_user_123_restaurant", name: "Burgers & Sandwiches", displayOrder: 1, createdAt: new Date().toISOString() },
  { id: "cat3", restaurantId: "demo_user_123_restaurant", name: "Desserts & Shakes", displayOrder: 2, createdAt: new Date().toISOString() },
  
  { id: "cat_alex_1", restaurantId: "mock_owner_alex_restaurant", name: "Starters", displayOrder: 0, createdAt: new Date().toISOString() },
  { id: "cat_alex_2", restaurantId: "mock_owner_alex_restaurant", name: "Main Courses", displayOrder: 1, createdAt: new Date().toISOString() },
  { id: "cat_alex_3", restaurantId: "mock_owner_alex_restaurant", name: "Beverages", displayOrder: 2, createdAt: new Date().toISOString() },

  { id: "cat_sarah_1", restaurantId: "mock_owner_sarah_restaurant", name: "Gourmet Pizzas", displayOrder: 0, createdAt: new Date().toISOString() },
  { id: "cat_sarah_2", restaurantId: "mock_owner_sarah_restaurant", name: "Appetizers", displayOrder: 1, createdAt: new Date().toISOString() },

  { id: "cat_kenji_1", restaurantId: "mock_owner_kenji_restaurant", name: "Signature Rolls", displayOrder: 0, createdAt: new Date().toISOString() },
  { id: "cat_kenji_2", restaurantId: "mock_owner_kenji_restaurant", name: "Sashimi", displayOrder: 1, createdAt: new Date().toISOString() },

  { id: "cat_elena_1", restaurantId: "mock_owner_elena_restaurant", name: "Cupcakes", displayOrder: 0, createdAt: new Date().toISOString() },
  { id: "cat_elena_2", restaurantId: "mock_owner_elena_restaurant", name: "Breads", displayOrder: 1, createdAt: new Date().toISOString() }
];

const SEED_MENUITEMS: MenuItem[] = [
  { id: "item1", restaurantId: "demo_user_123_restaurant", categoryId: "cat1", name: "Classic Cheeseburger", description: "Juicy beef patty with cheese", price: 14.99, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60", veg: false, bestseller: true, available: true, createdAt: new Date().toISOString() },
  { id: "item2", restaurantId: "demo_user_123_restaurant", categoryId: "cat1", name: "Truffle Parmesan Fries", description: "Fries with truffle oil", price: 8.49, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: true, available: true, createdAt: new Date().toISOString() },
  { id: "item3", restaurantId: "demo_user_123_restaurant", categoryId: "cat2", name: "Avocado Garden Club", description: "Fresh sandwich with avocado", price: 12.99, image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: false, available: true, createdAt: new Date().toISOString() },

  { id: "item_alex_1", restaurantId: "mock_owner_alex_restaurant", categoryId: "cat_alex_1", name: "Onion Soup", description: "French onion soup with cheese crouton", price: 7.99, image: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: false, available: true, createdAt: new Date().toISOString() },
  { id: "item_alex_2", restaurantId: "mock_owner_alex_restaurant", categoryId: "cat_alex_2", name: "Steak Frites", description: "Ribeye steak cooked to order with crisp fries", price: 24.99, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=60", veg: false, bestseller: true, available: true, createdAt: new Date().toISOString() },
  { id: "item_alex_3", restaurantId: "mock_owner_alex_restaurant", categoryId: "cat_alex_3", name: "Red Wine Glass", description: "Bordeaux Merlot", price: 9.00, image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: false, available: true, createdAt: new Date().toISOString() },

  { id: "item_sarah_1", restaurantId: "mock_owner_sarah_restaurant", categoryId: "cat_sarah_1", name: "Pepperoni Feast", description: "Double pepperoni with extra mozzarella", price: 16.99, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=60", veg: false, bestseller: true, available: true, createdAt: new Date().toISOString() },
  { id: "item_sarah_2", restaurantId: "mock_owner_sarah_restaurant", categoryId: "cat_sarah_1", name: "Margherita Supreme", description: "Fresh basil, roma tomatoes, buffalo mozzarella", price: 13.99, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: false, available: true, createdAt: new Date().toISOString() },
  { id: "item_sarah_3", restaurantId: "mock_owner_sarah_restaurant", categoryId: "cat_sarah_2", name: "Garlic Knots", description: "Freshly baked knots with garlic butter and parsley", price: 5.99, image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: true, available: true, createdAt: new Date().toISOString() },

  { id: "item_kenji_1", restaurantId: "mock_owner_kenji_restaurant", categoryId: "cat_kenji_1", name: "Dragon Roll", description: "Eel and cucumber inside, avocado and unagi sauce outside", price: 15.99, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&auto=format&fit=crop&q=60", veg: false, bestseller: true, available: true, createdAt: new Date().toISOString() },
  { id: "item_kenji_2", restaurantId: "mock_owner_kenji_restaurant", categoryId: "cat_kenji_1", name: "Volcano Roll", description: "Spicy tuna with baked scallops and spicy mayo", price: 14.99, image: "https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&auto=format&fit=crop&q=60", veg: false, bestseller: false, available: true, createdAt: new Date().toISOString() },
  { id: "item_kenji_3", restaurantId: "mock_owner_kenji_restaurant", categoryId: "cat_kenji_2", name: "Salmon Sashimi Plate", description: "5 pieces of fresh Atlantic salmon", price: 12.99, image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&auto=format&fit=crop&q=60", veg: false, bestseller: true, available: true, createdAt: new Date().toISOString() },
  { id: "item_kenji_4", restaurantId: "mock_owner_kenji_restaurant", categoryId: "cat_kenji_2", name: "Tuna Tataki", description: "Seared tuna with ponzu sauce", price: 13.99, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&auto=format&fit=crop&q=60", veg: false, bestseller: false, available: true, createdAt: new Date().toISOString() },

  { id: "item_elena_1", restaurantId: "mock_owner_elena_restaurant", categoryId: "cat_elena_1", name: "Red Velvet Swirl Cupcake", description: "Decadent cocoa cake topped with vanilla cream cheese frosting", price: 3.75, image: "https://images.unsplash.com/photo-1614707267537-b85acf00c4b8?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: true, available: true, createdAt: new Date().toISOString() },
  { id: "item_elena_2", restaurantId: "mock_owner_elena_restaurant", categoryId: "cat_elena_1", name: "Lemon Meringue Cupcake", description: "Zesty lemon cake filled with lemon curd and fluffy meringue toast", price: 3.99, image: "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400&auto=format&fit=crop&q=60", veg: true, bestseller: false, available: true, createdAt: new Date().toISOString() }
];

export const getMockAllUsers = (): UserProfile[] => {
  const data = localStorage.getItem("menuflow_mock_users_list");
  if (!data) {
    localStorage.setItem("menuflow_mock_users_list", JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  return JSON.parse(data) as UserProfile[];
};

export const getMockAllRestaurants = (): Restaurant[] => {
  const data = localStorage.getItem("menuflow_mock_restaurants_list");
  if (!data) {
    localStorage.setItem("menuflow_mock_restaurants_list", JSON.stringify(SEED_RESTAURANTS));
    return SEED_RESTAURANTS;
  }
  return JSON.parse(data) as Restaurant[];
};

export const getMockAllCategories = (): Category[] => {
  const data = localStorage.getItem("menuflow_mock_categories");
  if (!data) {
    localStorage.setItem("menuflow_mock_categories", JSON.stringify(SEED_CATEGORIES));
    return SEED_CATEGORIES;
  }
  return JSON.parse(data) as Category[];
};

export const getMockAllMenuItems = (): MenuItem[] => {
  const data = localStorage.getItem("menuflow_mock_menuitems");
  if (!data) {
    localStorage.setItem("menuflow_mock_menuitems", JSON.stringify(SEED_MENUITEMS));
    return SEED_MENUITEMS;
  }
  return JSON.parse(data) as MenuItem[];
};

export const resetMockDatabase = (): void => {
  localStorage.setItem("menuflow_mock_users_list", JSON.stringify(SEED_USERS));
  localStorage.setItem("menuflow_mock_restaurants_list", JSON.stringify(SEED_RESTAURANTS));
  localStorage.setItem("menuflow_mock_categories", JSON.stringify(SEED_CATEGORIES));
  localStorage.setItem("menuflow_mock_menuitems", JSON.stringify(SEED_MENUITEMS));
  
  const demoProfile = SEED_USERS[0];
  const demoRest = SEED_RESTAURANTS[0];
  localStorage.setItem("menuflow_mock_profile", JSON.stringify(demoProfile));
  localStorage.setItem("menuflow_mock_restaurant", JSON.stringify(demoRest));
};

// ==========================================
// SYSTEM ADMIN DB SERVICES
// ==========================================

export const adminGetUsers = async (): Promise<UserProfile[]> => {
  if (!isConfigValid) {
    return getMockAllUsers();
  }
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

export const adminGetRestaurants = async (): Promise<Restaurant[]> => {
  if (!isConfigValid) {
    return getMockAllRestaurants();
  }
  const snap = await getDocs(collection(db, "restaurants"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Restaurant));
};

export const adminGetCategories = async (): Promise<Category[]> => {
  if (!isConfigValid) {
    return getMockAllCategories();
  }
  const snap = await getDocs(collection(db, "categories"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const adminGetAllMenuItems = async (): Promise<MenuItem[]> => {
  if (!isConfigValid) {
    return getMockAllMenuItems();
  }
  const snap = await getDocs(collection(db, "menuItems"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
};

export const adminUpdateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  if (!isConfigValid) {
    const allUsers = getMockAllUsers();
    const idx = allUsers.findIndex(u => u.uid === uid);
    if (idx !== -1) {
      allUsers[idx] = { ...allUsers[idx], ...updates };
      localStorage.setItem("menuflow_mock_users_list", JSON.stringify(allUsers));
    }
    return;
  }
  await updateDoc(doc(db, "users", uid), updates);
};

export const adminUpdateRestaurant = async (restaurantId: string, updates: Partial<Restaurant>): Promise<void> => {
  if (!isConfigValid) {
    const allRests = getMockAllRestaurants();
    const idx = allRests.findIndex(r => r.id === restaurantId);
    if (idx !== -1) {
      allRests[idx] = { ...allRests[idx], ...updates };
      localStorage.setItem("menuflow_mock_restaurants_list", JSON.stringify(allRests));
    }
    return;
  }
  await updateDoc(doc(db, "restaurants", restaurantId), updates);
};

export const adminDeleteUserAccount = async (uid: string, restaurantId: string): Promise<void> => {
  if (!isConfigValid) {
    const allUsers = getMockAllUsers().filter(u => u.uid !== uid);
    localStorage.setItem("menuflow_mock_users_list", JSON.stringify(allUsers));

    const allRests = getMockAllRestaurants().filter(r => r.id !== restaurantId);
    localStorage.setItem("menuflow_mock_restaurants_list", JSON.stringify(allRests));

    const allCats = getMockAllCategories().filter(c => c.restaurantId !== restaurantId);
    localStorage.setItem("menuflow_mock_categories", JSON.stringify(allCats));

    const allItems = getMockAllMenuItems().filter(i => i.restaurantId !== restaurantId);
    localStorage.setItem("menuflow_mock_menuitems", JSON.stringify(allItems));
    return;
  }

  await deleteDoc(doc(db, "users", uid));
  await deleteDoc(doc(db, "restaurants", restaurantId));
  
  const categoriesSnap = await getDocs(query(collection(db, "categories"), where("restaurantId", "==", restaurantId)));
  const menuItemsSnap = await getDocs(query(collection(db, "menuItems"), where("restaurantId", "==", restaurantId)));

  const batch = writeBatch(db);
  categoriesSnap.forEach(d => batch.delete(d.ref));
  menuItemsSnap.forEach(d => batch.delete(d.ref));
  await batch.commit();
};

export const adminDeleteMenuItem = async (restaurantId: string, itemId: string): Promise<void> => {
  await deleteMenuItem(restaurantId, itemId);
};

export const adminUpdateMenuItem = async (restaurantId: string, itemId: string, updates: Partial<Omit<MenuItem, "id" | "restaurantId" | "createdAt">>): Promise<void> => {
  await updateMenuItem(restaurantId, itemId, updates);
};

export const adminCreateMenuItem = async (restaurantId: string, itemData: Omit<MenuItem, "id" | "restaurantId" | "createdAt">): Promise<string> => {
  return await createMenuItem(restaurantId, itemData);
};

