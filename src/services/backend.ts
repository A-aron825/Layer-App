import { ClothingItem, Outfit, User } from "../types";

// Keys for LocalStorage
const USERS_KEY = 'layer_users';
const CURRENT_USER_KEY = 'layer_current_user';
const ITEMS_KEY = 'layer_items';
const OUTFITS_KEY = 'layer_outfits';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const backend = {
  // --- AUTHENTICATION ---

  async signup(user: Omit<User, 'id'>): Promise<User> {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Check if email exists
    if (users.find((u: User) => u.email === user.email)) {
      throw new Error('User already exists');
    }

    const newUser: User = { ...user, id: Date.now().toString() };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Auto login
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async login(email: string, password: string): Promise<User> {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // --- WARDROBE ITEMS ---

  async getItems(): Promise<ClothingItem[]> {
    await delay(300);
    const user = this.getCurrentUser();
    if (!user) return [];

    const allItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
    return allItems.filter((item: ClothingItem) => item.userId === user.id);
  },

  async addItem(item: Omit<ClothingItem, 'id' | 'userId'>): Promise<ClothingItem> {
    await delay(300);
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const allItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
    
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
      userId: user.id
    };

    allItems.push(newItem);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(allItems));
    return newItem;
  },

  async deleteItem(itemId: string): Promise<void> {
    const allItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
    const filtered = allItems.filter((i: ClothingItem) => i.id !== itemId);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
  },

  // --- OUTFITS ---

  async getOutfits(): Promise<Outfit[]> {
    await delay(300);
    const user = this.getCurrentUser();
    if (!user) return [];

    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    // Return outfits sorted by date descending
    return allOutfits
      .filter((o: Outfit) => o.userId === user.id)
      .sort((a: Outfit, b: Outfit) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveOutfit(outfit: Omit<Outfit, 'id' | 'userId'>): Promise<Outfit> {
    await delay(300);
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    
    const newOutfit: Outfit = {
      ...outfit,
      id: Date.now(),
      userId: user.id
    };

    allOutfits.push(newOutfit);
    localStorage.setItem(OUTFITS_KEY, JSON.stringify(allOutfits));
    return newOutfit;
  }
};