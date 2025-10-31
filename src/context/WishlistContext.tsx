// src/context/WishlistContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
interface WishlistContextType {
  wishlist: Set<string>;
  toggleWishlist: (carId: string) => void;
  isWishlisted: (carId: string) => boolean;
}
 
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
 
const WISHLIST_KEY = 'user_wishlist';
 
export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
 
  // Load wishlist from AsyncStorage on mount
  useEffect(() => {
    loadWishlist();
  }, []);
 
  // Save wishlist to AsyncStorage whenever it changes
  useEffect(() => {
    saveWishlist();
  }, [wishlist]);
 
  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(WISHLIST_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        setWishlist(new Set(arr));
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  };
 
  const saveWishlist = async () => {
    try {
      const arr = Array.from(wishlist);
      await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(arr));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  };
 
  const toggleWishlist = (carId: string) => {
    setWishlist((prev) => {
      const copy = new Set(prev);
      if (copy.has(carId)) {
        copy.delete(carId);
      } else {
        copy.add(carId);
      }
      return copy;
    });
  };
 
  const isWishlisted = (carId: string) => {
    return wishlist.has(carId);
  };
 
  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};
 
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
 