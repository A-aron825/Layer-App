
import { ClothingItem, Outfit, User, CommunityPost } from "../types";

const USERS_KEY = 'layer_users';
const CURRENT_USER_KEY = 'layer_current_user';
const ITEMS_KEY = 'layer_items';
const OUTFITS_KEY = 'layer_outfits';
const COMMUNITY_KEY = 'layer_community';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const backend = {
  async signup(user: Omit<User, 'id'>): Promise<User> {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find((u: User) => u.email === user.email)) {
      throw new Error('User already exists');
    }
    const newUser: User = { ...user, id: Date.now().toString(), plan: 'Starter' };
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
    const newItem: ClothingItem = { ...item, id: Date.now().toString(), userId: user.id };
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
    const newOutfit: Outfit = { ...outfit, id: Date.now(), userId: user.id };
    allOutfits.push(newOutfit);
    localStorage.setItem(OUTFITS_KEY, JSON.stringify(allOutfits));
    return newOutfit;
  },

  async getCommunityPosts(): Promise<CommunityPost[]> {
    const posts = JSON.parse(localStorage.getItem(COMMUNITY_KEY) || '[]');
    if (posts.length === 0) {
      const seed: CommunityPost[] = [
        { id: '1', title: 'Cyberpunk Minimalist', author: 'NeoStyle', likes: 142, imageUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
        { id: '2', title: 'Streetwear Fusion', author: 'LayerKing', likes: 89, imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
        { id: '3', title: 'Cozy Oversized Vibe', author: 'SoftVibes', likes: 231, imageUrl: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
        { id: '4', title: 'Formal Brutalism', author: 'ArchitectMode', likes: 56, imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800', timestamp: new Date().toISOString() },
      ];
      localStorage.setItem(COMMUNITY_KEY, JSON.stringify(seed));
      return seed;
    }
    return posts;
  },

  async addCommunityPost(post: Omit<CommunityPost, 'id' | 'likes' | 'timestamp'>): Promise<CommunityPost> {
    const posts = JSON.parse(localStorage.getItem(COMMUNITY_KEY) || '[]');
    const newPost: CommunityPost = { ...post, id: Date.now().toString(), likes: 0, timestamp: new Date().toISOString() };
    posts.unshift(newPost);
    localStorage.setItem(COMMUNITY_KEY, JSON.stringify(posts));
    return newPost;
  }
};
