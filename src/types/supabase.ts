
export interface Profile {
  id: string;
  pseudo: string;
  skins?: any[]; // Pour le champ jsonb skins
  created_at?: string;
  default_skin_id?: number; // Champ ajouté pour la compatibilité
}

export interface GameSkin {
  id: number;
  name: string;
  description?: string;
  is_paid: boolean;
  price?: number;
  data: {
    colors: string[];
    // Ces champs sont retirés car pas utilisés dans la BDD pour le moment
    // pattern?: string;
    // segmentSpacing?: number;
  };
  stripe_product_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSkin {
  id: number;
  user_id: string;
  skin_id: number;
  purchased_at: string; // Changé de purchase_date à purchased_at
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}
