import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  type User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  signInWithPopup,
  deleteUser
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db, googleProvider, isConfigValid } from "../firebase/config";
import type { UserProfile, Restaurant, Category, MenuItem } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  restaurant: Restaurant | null;
  loading: boolean;
  isMock: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateRestaurantState: (updates: Partial<Restaurant>) => void;
  updateUserProfileState: (updates: Partial<UserProfile>) => Promise<void>;
  deleteRestaurantAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// LocalStorage mock state keys
const MOCK_USER_KEY = "menuflow_mock_user";
const MOCK_PROFILE_KEY = "menuflow_mock_profile";
const MOCK_RESTAURANT_KEY = "menuflow_mock_restaurant";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(!isConfigValid);

  // Initialize mock state if needed
  const setupMockData = (uid: string, email: string, name: string) => {
    const mockUser = { uid, email, displayName: name } as unknown as User;
    
    const mockRestaurant: Restaurant = {
      id: `${uid}_restaurant`,
      ownerId: uid,
      name: "Delicious Bistro",
      logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      banner: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
      address: "123 Gourmet Street, Foodville",
      phone: "+1 (555) 123-4567",
      email: email,
      website: "https://deliciousbistro.com",
      openingHours: "Mon - Sun: 09:00 AM - 10:00 PM",
      themeColor: "#8b5cf6",
      currency: "USD",
      language: "en",
      createdAt: new Date().toISOString(),
    };

    const role = email.toLowerCase() === "demo@menuflow.com" || email.toLowerCase().includes("admin") ? "Admin" : "User";
    const mockProfile: UserProfile = {
      uid,
      name,
      email,
      restaurantId: mockRestaurant.id,
      role,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(mockProfile));
    localStorage.setItem(MOCK_RESTAURANT_KEY, JSON.stringify(mockRestaurant));

    // Seed mock lists
    try {
      const usersData = localStorage.getItem("menuflow_mock_users_list");
      const allUsers = usersData ? JSON.parse(usersData) : [];
      if (!allUsers.some((u: any) => u.uid === uid)) {
        allUsers.push(mockProfile);
        localStorage.setItem("menuflow_mock_users_list", JSON.stringify(allUsers));
      }

      const restsData = localStorage.getItem("menuflow_mock_restaurants_list");
      const allRests = restsData ? JSON.parse(restsData) : [];
      if (!allRests.some((r: any) => r.id === mockRestaurant.id)) {
        allRests.push(mockRestaurant);
        localStorage.setItem("menuflow_mock_restaurants_list", JSON.stringify(allRests));
      }
    } catch (e) {
      console.error("Error updating mock lists:", e);
    }

    setUser(mockUser);
    setUserProfile(mockProfile);
    setRestaurant(mockRestaurant);
  };

  // Helper to ensure restaurant exists for a user (Firebase)
  const ensureUserRestaurant = async (firebaseUser: User, name?: string): Promise<{ profile: UserProfile, rest: Restaurant }> => {
    const profileRef = doc(db, "users", firebaseUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      const profile = profileSnap.data() as UserProfile;
      
      // Auto-assign Admin role to afnwafnw91@gmail.com or other admin emails if role is missing
      if (!profile.role) {
        const userEmail = profile.email || firebaseUser.email || "";
        profile.role = userEmail.toLowerCase() === "afnwafnw91@gmail.com" || userEmail.toLowerCase().includes("admin") ? "Admin" : "User";
        profile.status = profile.status || "Active";
        await setDoc(profileRef, { role: profile.role, status: profile.status }, { merge: true });
      }

      const restRef = doc(db, "restaurants", profile.restaurantId);
      const restSnap = await getDoc(restRef);
      
      if (restSnap.exists()) {
        return { profile, rest: restSnap.data() as Restaurant };
      } else {
        // Recreate restaurant if missing
        const rest: Restaurant = {
          id: `${firebaseUser.uid}_restaurant`,
          ownerId: firebaseUser.uid,
          name: name || firebaseUser.displayName || "My Restaurant",
          logo: "",
          banner: "",
          address: "",
          phone: "",
          email: firebaseUser.email || "",
          website: "",
          openingHours: "Mon-Sun: 9:00 AM - 10:00 PM",
          themeColor: "#8b5cf6",
          currency: "USD",
          language: "en",
          createdAt: new Date().toISOString(),
        };
        await setDoc(restRef, rest);
        return { profile, rest };
      }
    } else {
      // Create new restaurant and profile
      const restaurantId = `${firebaseUser.uid}_restaurant`;
      const rest: Restaurant = {
        id: restaurantId,
        ownerId: firebaseUser.uid,
        name: name || firebaseUser.displayName || "My Restaurant",
        logo: "",
        banner: "",
        address: "",
        phone: "",
        email: firebaseUser.email || "",
        website: "",
        openingHours: "Mon-Sun: 9:00 AM - 10:00 PM",
        themeColor: "#8b5cf6",
        currency: "USD",
        language: "en",
        createdAt: new Date().toISOString(),
      };
      
      const role = (firebaseUser.email || "").toLowerCase() === "admin@menuflow.com" || (firebaseUser.email || "").toLowerCase().includes("admin") ? "Admin" : "User";
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        name: name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Owner",
        email: firebaseUser.email || "",
        restaurantId,
        role,
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "restaurants", restaurantId), rest);
      await setDoc(profileRef, profile);
      
      return { profile, rest };
    }
  };

  useEffect(() => {
    if (!isConfigValid) {
      // Setup mock user state from localStorage
      const storedUser = localStorage.getItem(MOCK_USER_KEY);
      const storedProfile = localStorage.getItem(MOCK_PROFILE_KEY);
      const storedRestaurant = localStorage.getItem(MOCK_RESTAURANT_KEY);

      if (storedUser && storedProfile && storedRestaurant) {
        setUser(JSON.parse(storedUser));
        setUserProfile(JSON.parse(storedProfile));
        setRestaurant(JSON.parse(storedRestaurant));
      }
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const { profile, rest } = await ensureUserRestaurant(firebaseUser);
          setUser(firebaseUser);
          setUserProfile(profile);
          setRestaurant(rest);
          setIsMock(false);
        } catch (error) {
          console.error("Error setting up user session:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setRestaurant(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isConfigValid) {
      if (email === "demo@menuflow.com" && password === "password") {
        setupMockData("demo_user_123", email, "Demo Owner");
        return;
      }
      throw new Error("Invalid demo credentials! Use demo@menuflow.com / password");
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    if (!isConfigValid) {
      setupMockData("mock_" + Date.now(), email, name);
      return;
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserRestaurant(userCredential.user, name);
  };

  const loginWithGoogle = async () => {
    if (!isConfigValid) {
      setupMockData("mock_google_" + Date.now(), "google.user@example.com", "Google Owner");
      return;
    }
    const userCredential = await signInWithPopup(auth, googleProvider);
    await ensureUserRestaurant(userCredential.user);
  };

  const logout = async () => {
    if (!isConfigValid) {
      localStorage.removeItem(MOCK_USER_KEY);
      localStorage.removeItem(MOCK_PROFILE_KEY);
      localStorage.removeItem(MOCK_RESTAURANT_KEY);
      setUser(null);
      setUserProfile(null);
      setRestaurant(null);
      return;
    }
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!isConfigValid) {
      console.log(`Mock reset password email sent to: ${email}`);
      return;
    }
    await sendPasswordResetEmail(auth, email);
  };

  const updateRestaurantState = (updates: Partial<Restaurant>) => {
    if (!restaurant) return;
    const updated = { ...restaurant, ...updates };
    setRestaurant(updated);
    if (!isConfigValid) {
      localStorage.setItem(MOCK_RESTAURANT_KEY, JSON.stringify(updated));
    }
  };

  const deleteRestaurantAccount = async () => {
    if (!isConfigValid) {
      const currentUid = userProfile?.uid;
      const currentRestId = restaurant?.id;

      localStorage.removeItem(MOCK_USER_KEY);
      localStorage.removeItem(MOCK_PROFILE_KEY);
      localStorage.removeItem(MOCK_RESTAURANT_KEY);
      
      if (currentUid) {
        try {
          const usersData = localStorage.getItem("menuflow_mock_users_list");
          if (usersData) {
            const allUsers = JSON.parse(usersData) as UserProfile[];
            localStorage.setItem("menuflow_mock_users_list", JSON.stringify(allUsers.filter(u => u.uid !== currentUid)));
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (currentRestId) {
        try {
          const restsData = localStorage.getItem("menuflow_mock_restaurants_list");
          if (restsData) {
            const allRests = JSON.parse(restsData) as Restaurant[];
            localStorage.setItem("menuflow_mock_restaurants_list", JSON.stringify(allRests.filter(r => r.id !== currentRestId)));
          }
          
          const catsData = localStorage.getItem("menuflow_mock_categories");
          if (catsData) {
            const allCats = JSON.parse(catsData) as Category[];
            localStorage.setItem("menuflow_mock_categories", JSON.stringify(allCats.filter(c => c.restaurantId !== currentRestId)));
          }

          const itemsData = localStorage.getItem("menuflow_mock_menuitems");
          if (itemsData) {
            const allItems = JSON.parse(itemsData) as MenuItem[];
            localStorage.setItem("menuflow_mock_menuitems", JSON.stringify(allItems.filter(i => i.restaurantId !== currentRestId)));
          }
        } catch (e) {
          console.error(e);
        }
      }

      setUser(null);
      setUserProfile(null);
      setRestaurant(null);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !restaurant || !userProfile) return;

    // Delete restaurant items from DB
    await deleteDoc(doc(db, "restaurants", restaurant.id));
    await deleteDoc(doc(db, "users", currentUser.uid));
    
    // Delete authentication user
    await deleteUser(currentUser);
  };

  const updateUserProfileState = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates };
    setUserProfile(updated);
    if (!isConfigValid) {
      localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(updated));
      try {
        const usersData = localStorage.getItem("menuflow_mock_users_list");
        if (usersData) {
          const allUsers = JSON.parse(usersData) as UserProfile[];
          const idx = allUsers.findIndex(u => u.uid === userProfile.uid);
          if (idx !== -1) {
            allUsers[idx] = { ...allUsers[idx], ...updates };
            localStorage.setItem("menuflow_mock_users_list", JSON.stringify(allUsers));
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      await setDoc(doc(db, "users", userProfile.uid), updates, { merge: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        restaurant,
        loading,
        isMock,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        updateRestaurantState,
        updateUserProfileState,
        deleteRestaurantAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
