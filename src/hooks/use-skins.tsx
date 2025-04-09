
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { GameSkin, UserSkin } from '@/types/supabase';
import { useAuth } from './use-auth';

// Create a single Supabase client instance to avoid warnings
const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwMTQsImV4cCI6MjA1OTM2MjAxNH0.ge6A-qatlKPDFKA4N19KalL5fU9FBD4zBgIoXnKRRUc";
let supabaseInstance: any = null;

const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};

export const useSkins = () => {
  const supabase = getSupabase();
  const { user } = useAuth();
  
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [userSkins, setUserSkins] = useState<UserSkin[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the current selected skin
  const selectedSkin = allSkins.find(skin => skin.id === selectedSkinId) || null;

  // Calculate which skins the user owns
  const ownedSkinIds = new Set(userSkins.map(us => us.skin_id));

  // Free skins that user can use without purchase
  const freeSkins = allSkins.filter(skin => !skin.is_paid);
  
  // Paid skins that the user has purchased
  const purchasedSkins = allSkins.filter(skin => 
    skin.is_paid && ownedSkinIds.has(skin.id)
  );
  
  // All skins available to the user (free + purchased)
  const availableSkins = [...freeSkins, ...purchasedSkins];
  
  // Skins that could be purchased
  const purchasableSkins = allSkins.filter(skin => 
    skin.is_paid && !ownedSkinIds.has(skin.id)
  );

  useEffect(() => {
    fetchAllSkins();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserSkins();
    } else {
      setUserSkins([]);
    }
  }, [user]);

  // Select the first available skin if none is selected
  useEffect(() => {
    if (!selectedSkinId && availableSkins.length > 0) {
      setSelectedSkinId(availableSkins[0].id);
    }
  }, [availableSkins, selectedSkinId]);

  const fetchAllSkins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_skins')
        .select('*')
        .order('is_paid', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      setAllSkins(data as GameSkin[]);
    } catch (error) {
      console.error('Error fetching skins:', error);
      toast.error('Failed to load skins');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSkins = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_skins')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserSkins(data as UserSkin[]);
    } catch (error) {
      console.error('Error fetching user skins:', error);
      toast.error('Failed to load your skins');
    }
  };

  const setSelectedSkin = async (skinId: number) => {
    // Check if the skin is available for the user
    const isAvailable = availableSkins.some(skin => skin.id === skinId);
    
    if (!isAvailable) {
      toast.error("You don't own this skin");
      return;
    }
    
    setSelectedSkinId(skinId);
    
    // If the user is authenticated, update their profile with the selected skin
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ default_skin_id: skinId })
          .eq('id', user.id);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error updating default skin:', error);
        toast.error('Failed to save skin preference');
      }
    }
  };

  const getSkinById = (id: number | null): GameSkin | null => {
    if (!id) return null;
    return allSkins.find(skin => skin.id === id) || null;
  };

  return {
    allSkins,
    freeSkins,
    purchasedSkins,
    availableSkins,
    purchasableSkins,
    selectedSkin,
    selectedSkinId,
    setSelectedSkin,
    loading,
    getSkinById,
    refresh: () => {
      fetchAllSkins();
      if (user) fetchUserSkins();
    }
  };
};
