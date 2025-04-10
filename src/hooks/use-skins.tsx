
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { GameSkin, UserSkin } from '@/types/supabase';
import { useAuth } from './use-auth';

// Create a single Supabase client instance to avoid warnings
const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjAxNCwiZXhwIjoyMDU5MzYyMDE0fQ.K68E3MUX8mU7cnyoHVBHWvy9oVmeaRttsLjhERyenbQ";
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
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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

  const fetchAllSkins = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('game_skins')
        .select('*')
        .order('is_paid', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      setAllSkins(data as GameSkin[]);
      console.log("Fetched all skins:", data.length);
    } catch (error) {
      console.error('Error fetching skins:', error);
      toast.error('Failed to load skins');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchUserSkins = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_skins')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserSkins(data as UserSkin[]);
      console.log("Fetched user skins:", data.length);
    } catch (error) {
      console.error('Error fetching user skins:', error);
      toast.error('Failed to load your skins');
    }
  }, [user, supabase]);

  const fetchUserDefaultSkin = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('default_skin_id')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data && data.default_skin_id) {
        console.log("Found user default skin in profile:", data.default_skin_id);
        setSelectedSkinId(data.default_skin_id);
        localStorage.setItem('selected_skin_id', data.default_skin_id.toString());
      } else {
        console.log("No default skin in profile");
      }
    } catch (error) {
      console.error('Error fetching default skin:', error);
    }
  }, [user, supabase]);

  // Initial load of skins
  useEffect(() => {
    if (!initialLoadDone) {
      const loadInitialData = async () => {
        await fetchAllSkins();
        
        // After skins are loaded, check localStorage
        const savedSkinId = localStorage.getItem('selected_skin_id');
        if (savedSkinId) {
          const parsedId = parseInt(savedSkinId, 10);
          setSelectedSkinId(parsedId);
          console.log("Loaded selected skin ID from localStorage:", parsedId);
        }
        
        setInitialLoadDone(true);
      };
      
      loadInitialData();
    }
  }, [fetchAllSkins, initialLoadDone]);

  // Load user-specific skins when user state changes
  useEffect(() => {
    if (user && initialLoadDone) {
      const loadUserData = async () => {
        await fetchUserSkins();
        await fetchUserDefaultSkin();
      };
      loadUserData();
    } else if (!user) {
      setUserSkins([]);
    }
  }, [user, fetchUserSkins, fetchUserDefaultSkin, initialLoadDone]);

  // Select the first available skin if none is selected and skins are loaded
  useEffect(() => {
    if ((!selectedSkinId || !allSkins.find(skin => skin.id === selectedSkinId)) && 
        availableSkins.length > 0 && 
        !loading) {
      console.log("No skin selected, selecting first available:", availableSkins[0].id);
      setSelectedSkinId(availableSkins[0].id);
      localStorage.setItem('selected_skin_id', availableSkins[0].id.toString());
    }
  }, [availableSkins, selectedSkinId, loading, allSkins]);

  const setSelectedSkin = async (skinId: number) => {
    // Check if the skin is available for the user
    const isAvailable = availableSkins.some(skin => skin.id === skinId);
    
    if (!isAvailable) {
      toast.error("You don't own this skin");
      return;
    }
    
    console.log("Setting selected skin to:", skinId);
    setSelectedSkinId(skinId);
    
    // Always store in localStorage for immediate use
    localStorage.setItem('selected_skin_id', skinId.toString());
    
    // If the user is authenticated, update their profile with the selected skin
    if (user) {
      try {
        console.log("Updating user profile with selected skin:", skinId);
        const { error } = await supabase
          .from('profiles')
          .update({ default_skin_id: skinId })
          .eq('id', user.id);
          
        if (error) throw error;
        toast.success("Skin preference saved to your profile");
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

  const refresh = useCallback(() => {
    console.log("Refreshing skins data");
    fetchAllSkins();
    if (user) {
      fetchUserSkins();
      fetchUserDefaultSkin();
    }
  }, [fetchAllSkins, fetchUserSkins, fetchUserDefaultSkin, user]);

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
    refresh
  };
};
