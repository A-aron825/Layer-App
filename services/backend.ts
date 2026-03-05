
import { ClothingItem, Outfit, User, CommunityPost, Folder } from "../types";

const CURRENT_USER_KEY = 'layer_current_user';
const ITEMS_KEY = 'layer_items';
const OUTFITS_KEY = 'layer_outfits';
const FOLDERS_KEY = 'layer_folders';
const PLANNER_KEY = 'layer_planner';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get data from localStorage with fallback
const getLocalData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

// Helper to save data to localStorage
const saveLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const backend = {
  async signup(user: Omit<User, 'id'>): Promise<User> {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Signup failed');
    }
    const newUser = await response.json();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }
    const user = await response.json();
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

  async updatePlan(plan: 'Starter' | 'Pro' | 'Elite'): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const response = await fetch('/api/auth/plan', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, plan })
    });
    if (!response.ok) throw new Error("Failed to update plan");
    const updatedUser = await response.json();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  async getItems(): Promise<ClothingItem[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    const allItems = getLocalData<ClothingItem[]>(ITEMS_KEY, []);
    return allItems.filter(i => i.userId === user.id);
  },

  async addItem(item: Omit<ClothingItem, 'id' | 'userId'>): Promise<ClothingItem> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const newItem: ClothingItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id
    };
    const allItems = getLocalData<ClothingItem[]>(ITEMS_KEY, []);
    allItems.push(newItem);
    saveLocalData(ITEMS_KEY, allItems);
    return newItem;
  },

  async deleteItem(itemId: string): Promise<void> {
    const allItems = getLocalData<ClothingItem[]>(ITEMS_KEY, []);
    const filtered = allItems.filter(i => i.id !== itemId);
    saveLocalData(ITEMS_KEY, filtered);
  },

  async getOutfits(): Promise<Outfit[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    const allOutfits = getLocalData<Outfit[]>(OUTFITS_KEY, []);
    const userOutfits = allOutfits.filter(o => o.userId === user.id);
    return userOutfits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveOutfit(outfit: Omit<Outfit, 'id' | 'userId'>): Promise<Outfit> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const newOutfit: Outfit = {
      ...outfit,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      isFavorite: outfit.isFavorite ?? false
    };
    const allOutfits = getLocalData<Outfit[]>(OUTFITS_KEY, []);
    allOutfits.push(newOutfit);
    saveLocalData(OUTFITS_KEY, allOutfits);
    return newOutfit;
  },

  async toggleFavoriteOutfit(outfitId: string): Promise<Outfit> {
    const allOutfits = getLocalData<Outfit[]>(OUTFITS_KEY, []);
    const index = allOutfits.findIndex(o => o.id === outfitId);
    if (index === -1) throw new Error("Outfit not found");
    
    allOutfits[index].isFavorite = !allOutfits[index].isFavorite;
    saveLocalData(OUTFITS_KEY, allOutfits);
    return allOutfits[index];
  },

  async updateOutfitFolder(outfitId: string, folderId: string | null): Promise<Outfit> {
    const allOutfits = getLocalData<Outfit[]>(OUTFITS_KEY, []);
    const index = allOutfits.findIndex(o => o.id === outfitId);
    if (index === -1) throw new Error("Outfit not found");
    
    allOutfits[index].folderId = folderId || undefined;
    saveLocalData(OUTFITS_KEY, allOutfits);
    return allOutfits[index];
  },

  async deleteOutfit(outfitId: string): Promise<void> {
    const allOutfits = getLocalData<Outfit[]>(OUTFITS_KEY, []);
    const filtered = allOutfits.filter(o => o.id !== outfitId);
    saveLocalData(OUTFITS_KEY, filtered);
  },

  async getFolders(): Promise<Folder[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    const allFolders = getLocalData<Folder[]>(FOLDERS_KEY, []);
    return allFolders.filter(f => f.userId === user.id);
  },

  async createFolder(name: string, color?: string): Promise<Folder> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const newFolder: Folder = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color: color || '#6bb0d8',
      userId: user.id
    };
    const allFolders = getLocalData<Folder[]>(FOLDERS_KEY, []);
    allFolders.push(newFolder);
    saveLocalData(FOLDERS_KEY, allFolders);
    return newFolder;
  },

  async deleteFolder(folderId: string): Promise<void> {
    const allFolders = getLocalData<Folder[]>(FOLDERS_KEY, []);
    const filtered = allFolders.filter(f => f.id !== folderId);
    saveLocalData(FOLDERS_KEY, filtered);
    
    // Clear folderId from outfits
    const allOutfits = getLocalData<Outfit[]>(OUTFITS_KEY, []);
    const updatedOutfits = allOutfits.map(o => o.folderId === folderId ? { ...o, folderId: undefined } : o);
    saveLocalData(OUTFITS_KEY, updatedOutfits);
  },

  async getPlanner(): Promise<any[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    const allPlanners = getLocalData<any[]>(PLANNER_KEY, []);
    const userPlanner = allPlanners.find(p => p.userId === user.id);
    return userPlanner ? userPlanner.days : [
      { day: 'Mon', outfitId: null, note: '' },
      { day: 'Tue', outfitId: null, note: '' },
      { day: 'Wed', outfitId: null, note: '' },
      { day: 'Thu', outfitId: null, note: '' },
      { day: 'Fri', outfitId: null, note: '' },
      { day: 'Sat', outfitId: null, note: '' },
      { day: 'Sun', outfitId: null, note: '' }
    ];
  },

  async savePlanner(days: any[]): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const allPlanners = getLocalData<any[]>(PLANNER_KEY, []);
    const index = allPlanners.findIndex(p => p.userId === user.id);
    if (index === -1) {
      allPlanners.push({ userId: user.id, days });
    } else {
      allPlanners[index].days = days;
    }
    saveLocalData(PLANNER_KEY, allPlanners);
  },

  async getCommunityPosts(): Promise<CommunityPost[]> {
    const response = await fetch('/api/community');
    if (!response.ok) return [];
    return await response.json();
  },

  async addCommunityPost(post: Omit<CommunityPost, 'id' | 'likes' | 'timestamp'>): Promise<CommunityPost> {
    const response = await fetch('/api/community', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
    if (!response.ok) throw new Error("Failed to add community post");
    return await response.json();
  }
};
