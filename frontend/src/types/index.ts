// Types utilisateur
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'agent' | 'visitor';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  bio?: string;
  agency_name?: string;
  license_number?: string;
  rating_average: number;
  rating_count: number;
  email_verified: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role?: 'agent' | 'visitor';
  agency_name?: string;
  license_number?: string;
}

// Types propriété
export type PropertyType = 'apartment' | 'house' | 'villa' | 'land' | 'commercial' | 'office' | 'car' | 'suv' | 'truck' | 'motorcycle';
// Filtre spécial côté frontend : 'furnished' n'est pas un type DB, c'est le flag is_furnished
export type PropertyTypeFilter = PropertyType | 'furnished';
export type PropertyStanding = 'standard' | 'moyen' | 'haut_de_gamme';
export type TransactionType = 'sale' | 'rent';
export type PropertyStatus = 'draft' | 'published' | 'sold' | 'rented' | 'archived';

export interface Property {
  id: number;
  title: string;
  description: string;
  type: PropertyType;
  type_label: string;
  standing: PropertyStanding;
  standing_label: string;
  standing_priority: number;
  transaction_type: TransactionType;
  transaction_type_label: string;
  price: number;
  formatted_price: string;
  currency: string;
  area: number;
  price_per_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  floor?: number;
  total_floors?: number;
  construction_year?: number;
  is_furnished?: boolean;
  features?: string[];
  images: string[];
  main_image?: string;
  video_url?: string;
  virtual_tour_url?: string;
  address: string;
  city: string;
  quartier: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  status: PropertyStatus;
  is_featured: boolean;
  is_premium: boolean;
  view_count: number;
  contact_count: number;
  created_at: string;
  agent?: AgentInfo;
}

export interface AgentInfo {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  agency?: string;
  rating?: number;
  rating_count?: number;
  bio?: string;
}

export interface PropertyFilters {
  type?: PropertyTypeFilter;
  standing?: PropertyStanding;
  transaction_type?: TransactionType;
  city?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bedrooms?: number;
  features?: string[];
  search?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'standing' | 'popular' | 'created_at';
}

// Types avis
export interface Rating {
  id: number;
  agent_id: number;
  property_id?: number;
  rater_name: string;
  score: number;
  stars: string;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  property?: {
    id: number;
    title: string;
  };
  agent?: {
    id: number;
    name: string;
  };
}

export interface RatingStats {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

// Types catalogue
export interface CatalogPassword {
  id: number;
  password: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  is_valid: boolean;
  current_uses: number;
  max_uses: number;
  time_remaining?: string;
  uses_remaining: number;
}

export interface CatalogAccess {
  valid_until: string;
  time_remaining: string;
  uses_remaining: number;
}

export interface CatalogPurchase {
  password: string;
  valid_from: string;
  valid_until: string;
  time_remaining: string;
  uses_remaining: number;
  price: number;
  currency: string;
}

export interface CatalogPasswordInfo {
  password: string;
  valid_from: string;
  valid_until: string;
  time_remaining?: string;
  uses_remaining: number;
  current_uses?: number;
  max_uses?: number;
}

export interface CatalogPasswordHistoryItem extends CatalogPasswordInfo {
  id: number;
  is_active: boolean;
  is_valid: boolean;
  created_at: string;
}

export interface Agent {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  agency?: string;
  avatar?: string;
  rating: number;
  rating_count: number;
  properties_count: number;
  bio?: string;
  license_number?: string;
  status?: 'active' | 'inactive' | 'suspended';
  created_at?: string;
}

// Types API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  error_code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Types UI
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Constantes
// Types de biens (immobilier + véhicules)
export const PROPERTY_TYPES: Record<PropertyType, string> = {
  apartment: 'Appartement',
  house: 'Maison',
  villa: 'Villa',
  land: 'Terrain',
  commercial: 'Commercial',
  office: 'Bureau',
  car: 'Voiture',
  suv: 'SUV/4x4',
  truck: 'Camion',
  motorcycle: 'Moto',
};

// Types exposés dans les filtres (inclut la catégorie Meublé)
export const PROPERTY_TYPE_FILTERS: Record<PropertyTypeFilter, string> = {
  ...PROPERTY_TYPES,
  furnished: 'Meublé',
};

export const PROPERTY_STANDINGS: Record<PropertyStanding, string> = {
  standard: 'Standard',
  moyen: 'Moyen standing',
  haut_de_gamme: 'Haut de gamme',
};

export const TRANSACTION_TYPES: Record<TransactionType, string> = {
  sale: 'Vente',
  rent: 'Location',
};

export const STANDING_COLORS: Record<PropertyStanding, string> = {
  standard: 'bg-gray-500',
  moyen: 'bg-blue-500',
  haut_de_gamme: 'bg-gold-500',
};