
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [skinsRefreshNeeded, setSkinsRefreshNeeded] = useState(false);
  
  // Refs for tracking loading state
  const loadingTimerRef = useRef<number | null>(null);
  const lastSkinsUpdateRef = useRef<number>(Date.now());
  const loadingStartTimeRef = useRef<number | null>(null);
  const fetchInProgressRef = useRef<boolean>(false);
  
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
    // Prevent multiple concurrent fetches
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping duplicate call");
      return;
    }
    
    try {
      console.log("Fetching all skins...");
      setLoading(true);
      setFetchError(null);
      fetchInProgressRef.current = true;
      loadingStartTimeRef.current = Date.now();
      
      const { data, error } = await supabase
        .from('game_skins')
        .select('*')
        .order('is_paid', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      
      console.log("Fetched all skins:", data.length);
      setAllSkins(data as GameSkin[]);
      setSkinsLoaded(true);
      lastSkinsUpdateRef.current = Date.now();
    } catch (error: any) {
      console.error('Error fetching skins:', error);
      setFetchError(error);
      toast.error('Failed to load skins');
    } finally {
      setLoading(false);
      loadingStartTimeRef.current = null;
      fetchInProgressRef.current = false;
    }
  }, [supabase]);

  const fetchUserSkins = useCallback(async () => {
    if (!user) {
      console.log("No user, skipping user skins fetch");
      setUserSkinsLoaded(true);
      return;
    }
    
    // Don't run multiple fetches simultaneously
    if (fetchInProgressRef.current) {
      console.log("Another fetch is in progress, waiting");
      return;
    }
    
    try {
      console.log("Fetching user skins for user:", user.id);
      setFetchError(null);
      fetchInProgressRef.current = true;
      
      const { data, error } = await supabase
        .from('user_skins')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      console.log("Fetched user skins:", data.length);
      setUserSkins(data as UserSkin[]);
      setUserSkinsLoaded(true);
      lastSkinsUpdateRef.current = Date.now();
    } catch (error: any) {
      console.error('Error fetching user skins:', error);
      setFetchError(error);
      toast.error('Failed to load your skins');
    } finally {
      fetchInProgressRef.current = false;
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
    }
  }, [user, supabase]);

  const refresh = useCallback(() => {
    // Only refresh if not already fetching
    if (fetchInProgressRef.current) {
      console.log("Fetch already in progress, skipping refresh");
      return;
    }
    
    console.log("Refreshing skins data");
    setLoading(true);
    setSkinsLoaded(false);
    setUserSkinsLoaded(false);
    fetchAllSkins();
    if (user) {
      fetchUserSkins();
      fetchUserDefaultSkin();
    } else {
      setUserSkinsLoaded(true);
    }
  }, [fetchAllSkins, fetchUserSkins, fetchUserDefaultSkin, user]);

  // Initial load of all skins - executed once on component mount
  useEffect(() => {
    // Only fetch if we haven't already loaded the skins
    if (!skinsLoaded && !fetchInProgressRef.current) {
      fetchAllSkins();
    }
    
    // Set up visibility change listener for skins
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible, checking skins state");
        
        // Clear any existing loading reset timer
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        
        // Check if loading has been active for too long
        if (loading && loadingStartTimeRef.current) {
          const loadingDuration = Date.now() - loadingStartTimeRef.current;
          if (loadingDuration > 5000) { // 5 seconds threshold
            console.log("Skins loading state appears stuck, resetting");
            setLoading(false);
            fetchInProgressRef.current = false;
            setSkinsRefreshNeeded(true);
          }
        }
        
        // Check if we haven't updated skins in a while
        const lastUpdateTime = lastSkinsUpdateRef.current;
        const timeSinceLastUpdate = Date.now() - lastUpdateTime;
        const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        
        if (timeSinceLastUpdate > REFRESH_THRESHOLD) {
          console.log("Skins data is stale, marking for refresh");
          setSkinsRefreshNeeded(true);
        }
        
        if (skinsRefreshNeeded && !fetchInProgressRef.current) {
          console.log("Refreshing skins data after tab visibility change");
          refresh();
          setSkinsRefreshNeeded(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [fetchAllSkins, loading, skinsRefreshNeeded, skinsLoaded, refresh]);

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
    // Clear the fetch in progress flag when user changes
    fetchInProgressRef.current = false;
    
    if (user) {
      console.log("User detected, loading user-specific skin data");
      // Only fetch if we haven't already loaded the user skins
      if (!userSkinsLoaded) {
        fetchUserSkins();
        fetchUserDefaultSkin();
      }
    } else {
      console.log("No user, resetting user skins data");
      setUserSkins([]);
      setUserSkinsLoaded(true); // Mark as loaded even if we have no user
    }
  }, [user, fetchUserSkins, fetchUserDefaultSkin, userSkinsLoaded]);

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
