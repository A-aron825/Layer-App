
export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  styles: string[];
  plan?: 'Starter' | 'Pro' | 'Elite';
}

export interface ClothingItem {
  id: string;
  type: string;
  name: string;
  imageUrl: string;
  lastWorn?: Date;
  wearCount: number;
  resaleValue?: number;
  category: 'shirt' | 'hoodie' | 'bottom' | 'shoes' | 'outerwear' | 'accessory' | 'top';
  userId: string;
}

export interface Outfit {
  id: number;
  description: string;
  reasoning: string;
  date: string;
  userId: string;
  itemIds?: string[];
}

export interface CommunityPost {
  id: string;
  title: string;
  imageUrl: string;
  author: string;
  likes: number;
  timestamp: string;
}

export interface PlannedDay {
  day: string;
  outfitId: number | null;
  note: string;
}

export interface WeatherData {
  condition: string;
  temp: number;
  city: string;
}
