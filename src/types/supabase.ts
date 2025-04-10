
export interface Profile {
  id: string;
  pseudo: string;
  skins?: any[]; // For the jsonb skins field
  created_at?: string;
  default_skin_id?: number; // Keep this to maintain compatibility
}

export interface GameSkin {
  id: number;
  name: string;
  description?: string;
  is_paid: boolean;
  price?: number;
  data: {
    colors: string[];
    pattern?: string;
    segmentSpacing?: number;
  };
  stripe_product_id?: string; // Added this field to match database structure
  created_at: string;
  updated_at: string;
}

export interface UserSkin {
  id: number;
  user_id: string;
  skin_id: number;
  purchase_date: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}
