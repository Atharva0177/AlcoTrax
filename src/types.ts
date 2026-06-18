export interface UserProfile {
  userId?: string; // Firebase Auth UID
  displayName?: string; // Public name shown to other users
  weight: number; // in kg
  sex: 'M' | 'F' | 'O';
  age: number;
  weeklyLimit?: number;
  goals?: string;
  pacingRateLimit?: number; // Target drinks per hour
  avatar?: string; // Base64 or URL to avatar image
  friends?: string[]; // Array of user IDs
}

export interface MedicalInfo {
  bloodType: string;
  allergies: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface CustomDrink {
  id: string;
  name: string;
  abv: number;
  volume: number;
  icon: string;
  costPerUnit: number;
}

export interface SessionSummary {
  totalUnits: number;
  peakBac: number;
  durationMins: number;
  drinkCount: number;
  totalCalories: number;
  waterVolume: number;
  timestamp: number;
  consumedDrinks?: { name: string; iconUrl?: string; count: number }[];
}

export interface LoggedDrink {
  id: string;
  name: string;
  abv: number;
  volume: number;
  timestamp: number;
  calories: number;
  timeSinceLastDrink?: number; // in milliseconds
  iconUrl?: string; // Can be a data URL for uploads or a Lucide icon name
}

export interface User {
  name: string;
  avatar: string;
  status: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

export interface Drink {
  id: string;
  name: string;
  abv: number;
  volume: number;
  icon: string;
  color: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  unlockedAt: number; // Timestamp
}

export interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  time: string;
  units: number;
  duration: string;
  peakBac: string;
  badges: Badge[];
  kudos: number;
  support: number;
  timestamp: number;
  comments?: Comment[];
}

export interface Comment {
  userName: string;
  text: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'global' | 'weekend' | 'personal';
  progress: number;
  timeLeft?: string;
  stats?: string;
  status?: string;
}

export interface Friend {
  userId: string;
  name: string;
  avatar: string;
  currentBac?: number;
  streak: number; // Days of consecutive adherence
  addedAt: number; // Timestamp
}
