import { 
  collection, 
  doc, 
  getDoc, 
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
import type { Category, MenuItem, Restaurant } from "../types";

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
