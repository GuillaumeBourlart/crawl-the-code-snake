
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { GameSkin, UserSkin } from '@/types/supabase';
import { useAuth } from './use-auth';

export const useSkins = () => {
  const { user, supabase } = useAuth();
  
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [userSkins, setUserSkins] = useState<UserSkin[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [skinsLoaded, setSkinsLoaded] = useState(false);
  const [userSkinsLoaded, setUserSkinsLoaded] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

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
      console.log("Fetching all skins...");
      setLoading(true);
      setFetchError(null);
      
      const { data, error } = await supabase
        .from('game_skins')
        .select('*')
        .order('is_paid', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      
      console.log("Fetched all skins:", data.length);
      setAllSkins(data as GameSkin[]);
      setSkinsLoaded(true);
    } catch (error: any) {
      console.error('Error fetching skins:', error);
      setFetchError(error);
      toast.error('Failed to load skins');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchUserSkins = useCallback(async () => {
    if (!user) {
      console.log("No user, skipping user skins fetch");
      setUserSkinsLoaded(true);
      return;
    }
    
    try {
      console.log("Fetching user skins for user:", user.id);
      setFetchError(null);
      
      const { data, error } = await supabase
        .from('user_skins')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      console.log("Fetched user skins:", data.length);
      setUserSkins(data as UserSkin[]);
      setUserSkinsLoaded(true);
    } catch (error: any) {
      console.error('Error fetching user skins:', error);
      setFetchError(error);
      toast.error('Failed to load your skins');
    }
  }, [user, supabase]);

  const fetchUserDefaultSkin = useCallback(async () => {
    if (!user) {
      console.log("No user, skipping default skin fetch");
      return;
    }
    
    try {
      setFetchError(null);
      console.log("Fetching default skin for user:", user.id);
      
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
    } catch (error: any) {
      console.error('Error fetching default skin:', error);
      setFetchError(error);
      // Don't sign out here, just use local storage instead
    }
  }, [user, supabase]);

  // Initial load of all skins - executed once on component mount
  useEffect(() => {
    fetchAllSkins();
  }, [fetchAllSkins]);

  // Load saved skin from localStorage if no skin is selected
  useEffect(() => {
    if (allSkins.length > 0 && !selectedSkinId) {
      const savedSkinId = localStorage.getItem('selected_skin_id');
      if (savedSkinId) {
        const parsedId = parseInt(savedSkinId, 10);
        console.log("Loading selected skin ID from localStorage:", parsedId);
        setSelectedSkinId(parsedId);
      } else if (allSkins[0]) {
        // If no skin is selected and nothing in localStorage, select the first free skin
        console.log("No skin selected, selecting first available:", allSkins[0].id);
        setSelectedSkinId(allSkins[0].id);
        localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
      }
    }
  }, [allSkins, selectedSkinId]);

  // Load user-specific data when user state changes
  useEffect(() => {
    if (user) {
      console.log("User detected, loading user-specific skin data");
      fetchUserSkins();
      fetchUserDefaultSkin();
    } else {
      console.log("No user, resetting user skins data");
      setUserSkins([]);
      setUserSkinsLoaded(true); // Mark as loaded even if we have no user
    }
  }, [user, fetchUserSkins, fetchUserDefaultSkin]);

  const setSelectedSkin = async (skinId: number) => {
    // Check if the skin exists
    const skinExists = allSkins.some(skin => skin.id === skinId);
    
    if (!skinExists) {
      toast.error("Ce skin n'existe pas");
      return;
    }
    
    // Check if the skin is available for the user
    const skinData = allSkins.find(skin => skin.id === skinId);
    const isFreeSkin = skinData && !skinData.is_paid;
    const isPurchasedSkin = skinData && skinData.is_paid && ownedSkinIds.has(skinId);
    
    if (skinData?.is_paid && !isPurchasedSkin && user) {
      toast.error("Vous ne possédez pas ce skin");
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
        toast.success("Skin enregistré dans votre profil");
      } catch (error) {
        console.error('Error updating default skin:', error);
        toast.error('Échec de sauvegarde du skin');
      }
    }
  };

  const getSkinById = (id: number | null): GameSkin | null => {
    if (!id) return null;
    return allSkins.find(skin => skin.id === id) || null;
  };

  const refresh = useCallback(() => {
    console.log("Refreshing skins data");
    setLoading(true);
    fetchAllSkins();
    if (user) {
      fetchUserSkins();
      fetchUserDefaultSkin();
    } else {
      setUserSkinsLoaded(true);
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
    refresh,
    fetchError
  };
};
