
import { ClothingItem, Outfit, User, CommunityPost } from "../types";

const USERS_KEY = 'layer_users';
const CURRENT_USER_KEY = 'layer_current_user';
const ITEMS_KEY = 'layer_items';
const OUTFITS_KEY = 'layer_outfits';
const COMMUNITY_KEY = 'layer_community';
const FOLDERS_KEY = 'layer_folders';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const backend = {
  async signup(user: Omit<User, 'id'>): Promise<User> {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: User) => u.email === user.email)) {
      throw new Error('User already exists');
    }
    const newUser: User = { ...user, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, plan: 'Starter' };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async login(email: string, password: string): Promise<User> {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: User) => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
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
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const updatedUsers = users.map((u: User) => u.id === user.id ? { ...u, plan } : u);
    const updatedUser = { ...user, plan };
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  async getItems(): Promise<ClothingItem[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    const allItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
    return allItems.filter((item: ClothingItem) => item.userId === user.id);
  },

  async addItem(item: Omit<ClothingItem, 'id' | 'userId'>): Promise<ClothingItem> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const allItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
    const newItem: ClothingItem = { ...item, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, userId: user.id };
    allItems.push(newItem);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(allItems));
    return newItem;
  },

  async deleteItem(itemId: string): Promise<void> {
    const allItems = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
    const filtered = allItems.filter((i: ClothingItem) => i.id !== itemId);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
  },

  async getOutfits(): Promise<Outfit[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    return allOutfits
      .filter((o: Outfit) => o.userId === user.id)
      .sort((a: Outfit, b: Outfit) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveOutfit(outfit: Omit<Outfit, 'id' | 'userId'>): Promise<Outfit> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    const newOutfit: Outfit = { 
      ...outfit, 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      userId: user.id,
      isFavorite: outfit.isFavorite ?? false 
    };
    allOutfits.push(newOutfit);
    localStorage.setItem(OUTFITS_KEY, JSON.stringify(allOutfits));
    return newOutfit;
  },

  async toggleFavoriteOutfit(outfitId: string): Promise<Outfit> {
    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    const index = allOutfits.findIndex((o: Outfit) => o.id === outfitId);
    if (index === -1) throw new Error("Outfit not found");
    allOutfits[index].isFavorite = !allOutfits[index].isFavorite;
    localStorage.setItem(OUTFITS_KEY, JSON.stringify(allOutfits));
    return allOutfits[index];
  },

  async updateOutfitFolder(outfitId: string, folderId: string | null): Promise<Outfit> {
    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    const index = allOutfits.findIndex((o: Outfit) => o.id === outfitId);
    if (index === -1) throw new Error("Outfit not found");
    allOutfits[index].folderId = folderId || undefined;
    localStorage.setItem(OUTFITS_KEY, JSON.stringify(allOutfits));
    return allOutfits[index];
  },

  async deleteOutfit(outfitId: string): Promise<void> {
    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    const filtered = allOutfits.filter((o: Outfit) => o.id !== outfitId);
    localStorage.setItem(OUTFITS_KEY, JSON.stringify(filtered));
  },

  async getFolders(): Promise<Folder[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    const allFolders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
    return allFolders.filter((f: Folder) => f.userId === user.id);
  },

  async createFolder(name: string, color?: string): Promise<Folder> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    const allFolders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
    const newFolder: Folder = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      userId: user.id,
      color: color || '#6bb0d8'
    };
    allFolders.push(newFolder);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(allFolders));
    return newFolder;
  },

  async deleteFolder(folderId: string): Promise<void> {
    const allFolders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
    const filtered = allFolders.filter((f: Folder) => f.id !== folderId);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(filtered));
    
    // Also clear folderId from outfits in this folder
    const allOutfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
    const updatedOutfits = allOutfits.map((o: Outfit) => o.folderId === folderId ? { ...o, folderId: undefined } : o);
    localStorage.setItem(OUTFITS_KEY, JSON.stringify(updatedOutfits));
  },

  async getCommunityPosts(): Promise<CommunityPost[]> {
    try {
      const response = await fetch('/api/community');
      if (!response.ok) throw new Error("Failed to fetch community posts");
      return await response.json();
    } catch (e) {
      console.error("Community fetch error, falling back to local:", e);
      const posts = JSON.parse(localStorage.getItem(COMMUNITY_KEY) || '[]');
      return posts;
    }
  },

  async addCommunityPost(post: Omit<CommunityPost, 'id' | 'likes' | 'timestamp'>): Promise<CommunityPost> {
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
      if (!response.ok) throw new Error("Failed to add community post");
      return await response.json();
    } catch (e) {
      console.error("Community add error, falling back to local:", e);
      const posts = JSON.parse(localStorage.getItem(COMMUNITY_KEY) || '[]');
      const newPost: CommunityPost = { ...post, id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, likes: 0, timestamp: new Date().toISOString() };
      posts.unshift(newPost);
      localStorage.setItem(COMMUNITY_KEY, JSON.stringify(posts));
      return newPost;
    }
  }
};
