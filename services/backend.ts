
import { ClothingItem, Outfit, User, CommunityPost, Folder } from "../types";
import { supabase } from "./supabase";

const CURRENT_USER_KEY = 'layer_current_user';

export const backend = {
  async signup(user: Omit<User, 'id'>): Promise<User> {
    console.log("DEBUG: Starting signup for", user.email);
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password || 'password123', // Fallback if not provided
      options: {
        data: {
          username: user.username,
          styles: user.styles,
          plan: user.plan || 'Starter'
        }
      }
    });

    if (error) {
      console.error("DEBUG: Supabase signup error:", JSON.stringify(error, null, 2));
      throw error;
    }
    if (!data.user) {
      console.error("DEBUG: Signup failed - no user returned");
      throw new Error("Signup failed");
    }

    console.log("DEBUG: Signup success, user ID:", data.user.id);
    if (!data.session) {
      console.warn("DEBUG: Signup succeeded but no session returned. Email confirmation might be required.");
      // We still proceed to set local storage so the UI can show a "Check your email" state if we wanted,
      // but for now we'll just let the auth listener handle it.
    }

    const newUser: User = {
      id: data.user.id,
      email: data.user.email!,
      username: data.user.user_metadata.username,
      styles: data.user.user_metadata.styles,
      plan: data.user.user_metadata.plan
    };

    // Also save to a profiles table for easier querying if needed
    console.log("DEBUG: Upserting profile for", newUser.id);
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      styles: newUser.styles,
      plan: newUser.plan
    });

    if (profileError) {
      console.warn("DEBUG: Profile upsert failed (non-blocking):", JSON.stringify(profileError, null, 2));
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    return newUser;
  },

  async login(email: string, password: string): Promise<User> {
    console.log("DEBUG: Starting login for", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("DEBUG: Login error:", JSON.stringify(error, null, 2));
      throw error;
    }
    if (!data.user) {
      console.error("DEBUG: Login failed - no user returned");
      throw new Error("Login failed");
    }

    // Try to fetch profile from database to get the most up-to-date data
    console.log("DEBUG: Fetching profile for", data.user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn("DEBUG: Profile fetch failed (using metadata):", JSON.stringify(profileError, null, 2));
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username || data.user.user_metadata.username || data.user.email?.split('@')[0],
      styles: profile?.styles || data.user.user_metadata.styles || [],
      plan: profile?.plan || data.user.user_metadata.plan || 'Starter'
    };

    console.log("DEBUG: Login success, user:", user.username);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  async updatePlan(plan: 'Starter' | 'Pro' | 'Elite'): Promise<User> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.auth.updateUser({
      data: { plan }
    });

    if (error) throw error;

    const updatedUser = { ...user, plan };
    
    // Update profiles table too
    await supabase.from('profiles').update({ plan }).eq('id', user.id);

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  async getItems(): Promise<ClothingItem[]> {
    const user = this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching items:", error);
      return [];
    }
    
    // Map snake_case from DB to camelCase for app
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      imageUrl: item.image_url,
      category: item.category,
      wearCount: item.wear_count,
      lastWorn: item.last_worn ? new Date(item.last_worn) : undefined,
      resaleValue: item.resale_value,
      userId: item.user_id
    }));
  },

  async addItem(item: Omit<ClothingItem, 'id' | 'userId'>): Promise<ClothingItem> {
    const user = this.getCurrentUser();
    if (!user) {
      console.error("addItem failed: Not authenticated");
      throw new Error("Not authenticated");
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log("DEBUG: Supabase Session exists:", !!session);
    if (!session) {
      console.warn("DEBUG: No Supabase session found in client, but user exists in localStorage. This will likely 401.");
    }

    const dbItem = {
      name: item.name,
      type: item.type,
      image_url: item.imageUrl,
      category: item.category,
      wear_count: item.wearCount || 0,
      last_worn: item.lastWorn?.toISOString() || null,
      resale_value: item.resaleValue || 0,
      user_id: user.id
    };

    console.log("Supabase addItem attempt:", dbItem);

    const { data, error } = await supabase
      .from('clothing_items')
      .insert([dbItem])
      .select()
      .single();

    if (error) {
      console.error("Supabase addItem error details:", JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log("Supabase addItem success:", data);

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      imageUrl: data.image_url,
      category: data.category,
      wearCount: data.wear_count,
      lastWorn: data.last_worn ? new Date(data.last_worn) : undefined,
      resaleValue: data.resale_value,
      userId: data.user_id
    };
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error("Supabase deleteItem error:", error);
      throw error;
    }
  },

  async getOutfits(): Promise<Outfit[]> {
    const user = this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error("Error fetching outfits:", error);
      return [];
    }
    
    return (data || []).map(o => ({
      id: o.id,
      description: o.description,
      reasoning: o.reasoning,
      date: o.date,
      userId: o.user_id,
      itemIds: o.item_ids,
      imageUrl: o.image_url,
      isFavorite: o.is_favorite,
      folderId: o.folder_id
    }));
  },

  async saveOutfit(outfit: Omit<Outfit, 'id' | 'userId'>): Promise<Outfit> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const dbOutfit = {
      description: outfit.description,
      reasoning: outfit.reasoning,
      date: outfit.date,
      user_id: user.id,
      item_ids: outfit.itemIds,
      image_url: outfit.imageUrl,
      is_favorite: outfit.isFavorite ?? false,
      folder_id: outfit.folderId || null
    };

    const { data, error } = await supabase
      .from('outfits')
      .insert([dbOutfit])
      .select()
      .single();

    if (error) {
      console.error("Supabase saveOutfit error:", error);
      throw error;
    }
    
    return {
      id: data.id,
      description: data.description,
      reasoning: data.reasoning,
      date: data.date,
      userId: data.user_id,
      itemIds: data.item_ids,
      imageUrl: data.image_url,
      isFavorite: data.is_favorite,
      folderId: data.folder_id
    };
  },

  async toggleFavoriteOutfit(outfitId: string): Promise<Outfit> {
    const { data: current, error: fetchError } = await supabase
      .from('outfits')
      .select('is_favorite')
      .eq('id', outfitId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('outfits')
      .update({ is_favorite: !current?.is_favorite })
      .eq('id', outfitId)
      .select()
      .single();

    if (error) {
      console.error("Supabase toggleFavorite error:", error);
      throw error;
    }
    
    return {
      id: data.id,
      description: data.description,
      reasoning: data.reasoning,
      date: data.date,
      userId: data.user_id,
      itemIds: data.item_ids,
      imageUrl: data.image_url,
      isFavorite: data.is_favorite,
      folderId: data.folder_id
    };
  },

  async updateOutfitFolder(outfitId: string, folderId: string | null): Promise<Outfit> {
    const { data, error } = await supabase
      .from('outfits')
      .update({ folder_id: folderId || null })
      .eq('id', outfitId)
      .select()
      .single();

    if (error) {
      console.error("Supabase updateFolder error:", error);
      throw error;
    }
    
    return {
      id: data.id,
      description: data.description,
      reasoning: data.reasoning,
      date: data.date,
      userId: data.user_id,
      itemIds: data.item_ids,
      imageUrl: data.image_url,
      isFavorite: data.is_favorite,
      folderId: data.folder_id
    };
  },

  async deleteOutfit(outfitId: string): Promise<void> {
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', outfitId);

    if (error) {
      console.error("Supabase deleteOutfit error:", error);
      throw error;
    }
  },

  async getFolders(): Promise<Folder[]> {
    const user = this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching folders:", error);
      return [];
    }
    
    return (data || []).map(f => ({
      id: f.id,
      name: f.name,
      userId: f.user_id,
      color: f.color
    }));
  },

  async createFolder(name: string, color?: string): Promise<Folder> {
    const user = this.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('folders')
      .insert([{ 
        name, 
        color: color || '#6bb0d8', 
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase createFolder error:", error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      color: data.color
    };
  },

  async deleteFolder(folderId: string): Promise<void> {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) {
      console.error("Supabase deleteFolder error:", error);
      throw error;
    }

    // Clear folder_id from outfits (manual cascade)
    await supabase
      .from('outfits')
      .update({ folder_id: null })
      .eq('folder_id', folderId);
  },

  async getPlanner(): Promise<any[]> {
    const user = this.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('planner')
      .select('days')
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return [
        { day: 'Mon', outfitId: null, note: '' },
        { day: 'Tue', outfitId: null, note: '' },
        { day: 'Wed', outfitId: null, note: '' },
        { day: 'Thu', outfitId: null, note: '' },
        { day: 'Fri', outfitId: null, note: '' },
        { day: 'Sat', outfitId: null, note: '' },
        { day: 'Sun', outfitId: null, note: '' }
      ];
    }
    return data.days;
  },

  async savePlanner(days: any[]): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      console.error("savePlanner failed: Not authenticated");
      throw new Error("Not authenticated");
    }

    const { data: { session } } = await supabase.auth.getSession();
    console.log("DEBUG: Supabase Session exists in savePlanner:", !!session);
    if (!session) {
      console.warn("DEBUG: No Supabase session found in savePlanner, but user exists in localStorage. This will likely 401.");
    }

    const { error } = await supabase
      .from('planner')
      .upsert({ user_id: user.id, days });

    if (error) {
      console.error("Supabase savePlanner error:", JSON.stringify(error, null, 2));
      throw error;
    }
  },

  async addCommunityPost(post: Omit<CommunityPost, 'id' | 'likes' | 'timestamp'>): Promise<CommunityPost> {
    const { data, error } = await supabase
      .from('community_posts')
      .insert([{ 
        author: post.author,
        author_image: post.authorImage,
        content: post.content,
        image_url: post.image,
        likes: 0, 
        timestamp: new Date().toISOString() 
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase addCommunityPost error:", error);
      throw error;
    }
    
    return {
      id: data.id,
      author: data.author,
      authorImage: data.author_image,
      content: data.content,
      image: data.image_url,
      likes: data.likes,
      timestamp: data.timestamp
    };
  },

  async getCommunityPosts(): Promise<CommunityPost[]> {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Error fetching community posts:", error);
      return [];
    }
    
    return (data || []).map(p => ({
      id: p.id,
      author: p.author,
      authorImage: p.author_image,
      content: p.content,
      image: p.image_url,
      likes: p.likes,
      timestamp: p.timestamp
    }));
  }
};
