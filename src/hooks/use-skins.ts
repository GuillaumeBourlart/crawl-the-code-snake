
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwMTQsImV4cCI6MjA1OTM2MjAxNH0.ge6A-qatlKPDFKA4N19KalL5fU9FBD4zBgIoXnKRRUc";
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Skin {
  id: number;
  name: string;
  description: string | null;
  is_paid: boolean;
  price: number | null;
  data: {
    colors: string[];
    pattern?: string;
    segmentSpacing?: number;
  };
}

export const useSkins = () => {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkins = async () => {
      try {
        setIsLoading(true);
        // Fetch only free skins for now
        const { data, error } = await supabase
          .from('game_skins')
          .select('*')
          .eq('is_paid', false);

        if (error) {
          throw error;
        }

        setSkins(data || []);

        // If no skins in the database, create fallback skins
        if (!data || data.length === 0) {
          const fallbackSkins: Skin[] = [
            {
              id: 1,
              name: "Rouge Éclatant",
              description: "Un skin rouge vif",
              is_paid: false,
              price: null,
              data: {
                colors: ["#FF5733", "#FF8A65", "#FFCCBC"],
                pattern: "linear"
              }
            },
            {
              id: 2,
              name: "Vert Forêt",
              description: "Un skin vert profond",
              is_paid: false,
              price: null,
              data: {
                colors: ["#33FF57", "#66FF8D", "#B9FFC8"],
                pattern: "linear"
              }
            },
            {
              id: 3,
              name: "Bleu Océan",
              description: "Un skin bleu profond",
              is_paid: false,
              price: null,
              data: {
                colors: ["#3357FF", "#6F8DFF", "#C7D2FF"],
                pattern: "linear"
              }
            }
          ];
          setSkins(fallbackSkins);
        }
      } catch (err) {
        console.error("Error fetching skins:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        
        // Set fallback skins in case of error
        const fallbackSkins: Skin[] = [
          {
            id: 1,
            name: "Rouge Éclatant",
            description: "Un skin rouge vif",
            is_paid: false,
            price: null,
            data: {
              colors: ["#FF5733", "#FF8A65", "#FFCCBC"],
              pattern: "linear"
            }
          },
          {
            id: 2,
            name: "Vert Forêt",
            description: "Un skin vert profond",
            is_paid: false,
            price: null,
            data: {
              colors: ["#33FF57", "#66FF8D", "#B9FFC8"],
              pattern: "linear"
            }
          },
          {
            id: 3,
            name: "Bleu Océan",
            description: "Un skin bleu profond",
            is_paid: false,
            price: null,
            data: {
              colors: ["#3357FF", "#6F8DFF", "#C7D2FF"],
              pattern: "linear"
            }
          }
        ];
        setSkins(fallbackSkins);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkins();
  }, []);

  return { skins, isLoading, error };
};
