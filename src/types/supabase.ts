
export interface Profile {
  id: string;
  pseudo: string;
  skins?: any[]; // For the jsonb skins field
  created_at?: string;
  default_skin_id?: number;
}

export interface GameSkin {
  id: number;
  name: string;
  description?: string;
  is_paid: boolean;
  price?: number;
  data: {
    colors: string[];
  };
  stripe_product_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSkin {
  id: number;
  user_id: string;
  skin_id: number;
  purchased_at: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}
