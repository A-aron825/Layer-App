export interface User {
  id: string;
  email: string;
  username: string;
  password?: string; // In a real app, never store plain text!
  styles: string[];
}

export interface ClothingItem {
  id: string;
  type: string;
  name: string;
  imageUrl: string;
  lastWorn?: Date;
  wearCount: number;
  resaleValue?: number;
  category: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory';
  userId: string; // Foreign key
}

export interface Outfit {
  id: number;
  description: string;
  reasoning: string;
  date: string; // Stored as ISO string
  userId: string;
}

export interface WeatherData {
  condition: string;
  temp: number;
  city: string;
}