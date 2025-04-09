
export interface Profile {
  id: string;
  pseudo: string;
  email?: string;
  created_at: string;
  updated_at: string;
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
    pattern?: string;
    segmentSpacing?: number;
  };
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
