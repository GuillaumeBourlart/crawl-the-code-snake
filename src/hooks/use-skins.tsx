
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { GameSkin, UserSkin } from '@/types/supabase';
import { useAuth } from './use-auth';

// Local storage keys
const SKINS_RETRY_COUNT_KEY = 'skins_retry_count';
const SKINS_ERROR_TIMESTAMP_KEY = 'skins_error_timestamp';
const SKINS_LOAD_TIMESTAMP_KEY = 'skins_load_timestamp';

export const useSkins = () => {
  const { user, supabase, authInitialized } = useAuth();
  
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [userSkins, setUserSkins] = useState<UserSkin[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [skinsLoaded, setSkinsLoaded] = useState(false);
  const [userSkinsLoaded, setUserSkinsLoaded] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Record loading start time
  useEffect(() => {
    if (loading && !skinsLoaded) {
      localStorage.setItem(SKINS_LOAD_TIMESTAMP_KEY, Date.now().toString());
    } else if (skinsLoaded) {
      localStorage.removeItem(SKINS_LOAD_TIMESTAMP_KEY);
    }
  }, [loading, skinsLoaded]);

  // Helper function to check for stuck state
  const checkForStuckSkinsState = useCallback((): boolean => {
    const errorTimestamp = localStorage.getItem(SKINS_ERROR_TIMESTAMP_KEY);
    const loadTimestamp = localStorage.getItem(SKINS_LOAD_TIMESTAMP_KEY);
    
    if (errorTimestamp) {
      const errorTime = parseInt(errorTimestamp, 10);
      const now = Date.now();
      
      // If there was an error in the last 5 minutes
      if (now - errorTime < 5 * 60 * 1000) {
        console.log("Detected recent skins error, state might be stuck");
        return true;
      } else {
        // Clear old error timestamps
        localStorage.removeItem(SKINS_ERROR_TIMESTAMP_KEY);
      }
    }
    
    if (loadTimestamp) {
      const loadTime = parseInt(loadTimestamp, 10);
      const now = Date.now();
      
      // If loading started more than 20 seconds ago and never completed
      if (now - loadTime > 20 * 1000) {
        console.log("Detected stale skins loading state, might be stuck");
        return true;
      }
    }
    
    return false;
  }, []);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    let safetyTimeout: number;
    
    if (loading && !skinsLoaded) {
      safetyTimeout = window.setTimeout(() => {
        if (loading && !skinsLoaded) {
          console.log("Safety timeout triggered for skins loading");
          setLoading(false);
          setFetchError(new Error("Le chargement des skins a pris trop de temps"));
          localStorage.setItem(SKINS_ERROR_TIMESTAMP_KEY, Date.now().toString());
          
          // Try automatic refresh
          refresh();
        }
      }, 15000); // 15-second safety timeout
    }
    
    return () => {
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };
  }, [loading, skinsLoaded]);

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
    if (isRefreshing) return;
    
    try {
      console.log("Fetching all skins...");
      setLoading(true);
      setFetchError(null);
      setIsRefreshing(true);
      
      const { data, error } = await supabase
        .from('game_skins')
        .select('*')
        .order('is_paid', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;
      
      console.log("Fetched all skins:", data.length);
      setAllSkins(data as GameSkin[]);
      setSkinsLoaded(true);
      
      // Reset error status and retry count on success
      localStorage.removeItem(SKINS_ERROR_TIMESTAMP_KEY);
      localStorage.removeItem(SKINS_RETRY_COUNT_KEY);
      setRetryCount(0);
    } catch (error: any) {
      console.error('Error fetching skins:', error);
      setFetchError(error);
      localStorage.setItem(SKINS_ERROR_TIMESTAMP_KEY, Date.now().toString());
      
      // Increment retry count
      const currentRetryCount = parseInt(localStorage.getItem(SKINS_RETRY_COUNT_KEY) || '0', 10) + 1;
      localStorage.setItem(SKINS_RETRY_COUNT_KEY, currentRetryCount.toString());
      setRetryCount(currentRetryCount);
      
      toast.error('Erreur de chargement des skins');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, isRefreshing]);

  const fetchUserSkins = useCallback(async () => {
    if (!user || isRefreshing) {
      console.log("No user or already refreshing, skipping user skins fetch");
      if (!user) setUserSkinsLoaded(true);
      return;
    }
    
    try {
      console.log("Fetching user skins for user:", user.id);
      setFetchError(null);
      setIsRefreshing(true);
      
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
      localStorage.setItem(SKINS_ERROR_TIMESTAMP_KEY, Date.now().toString());
      toast.error('Erreur de chargement de vos skins');
    } finally {
      setIsRefreshing(false);
    }
  }, [user, supabase, isRefreshing]);

  const fetchUserDefaultSkin = useCallback(async () => {
    if (!user || isRefreshing) {
      console.log("No user or already refreshing, skipping default skin fetch");
      return;
    }
    
    try {
      setFetchError(null);
      console.log("Fetching default skin for user:", user.id);
      setIsRefreshing(true);
      
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
      localStorage.setItem(SKINS_ERROR_TIMESTAMP_KEY, Date.now().toString());
      // Don't sign out here, just use local storage instead
    } finally {
      setIsRefreshing(false);
    }
  }, [user, supabase, isRefreshing]);

  // Initial load of all skins - executed once when auth is initialized
  useEffect(() => {
    // Only start fetching when we know auth state is initialized
    if (authInitialized) {
      console.log("Auth initialized, checking for potentially stuck skins state");
      
      // Check if we might be in a stuck state
      if (checkForStuckSkinsState()) {
        // Clear any potential error or stuck state
        localStorage.removeItem(SKINS_LOAD_TIMESTAMP_KEY);
        setLoading(false);
        
        // Still need to fetch skins
        fetchAllSkins();
      } else {
        fetchAllSkins();
      }
    }
  }, [fetchAllSkins, authInitialized, checkForStuckSkinsState]);

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

  // Add handler for tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible in skins hook, checking state");
        
        // If we have a stuck loading state or error, or it's been a while since a refresh, refresh data
        if (loading || fetchError || checkForStuckSkinsState()) {
          console.log("Skins state needs refresh in visibility handler");
          setLoading(false); // Reset loading first
          refresh();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, fetchError, checkForStuckSkinsState]);

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
        localStorage.setItem(SKINS_ERROR_TIMESTAMP_KEY, Date.now().toString());
        toast.error('Échec de sauvegarde du skin');
      }
    }
  };

  const getSkinById = (id: number | null): GameSkin | null => {
    if (!id) return null;
    return allSkins.find(skin => skin.id === id) || null;
  };

  const resetSkinsState = useCallback(() => {
    console.log("Resetting skins state completely");
    
    // Clear any localStorage state for skins
    localStorage.removeItem(SKINS_ERROR_TIMESTAMP_KEY);
    localStorage.removeItem(SKINS_LOAD_TIMESTAMP_KEY);
    localStorage.removeItem(SKINS_RETRY_COUNT_KEY);
    
    // Reset state
    setLoading(false);
    setSkinsLoaded(false);
    setUserSkinsLoaded(false);
    setFetchError(null);
    setIsRefreshing(false);
    setRetryCount(0);
    
    // Return to initial state
    setAllSkins([]);
    
    // Don't reset selectedSkinId or userSkins to avoid UI flicker
    // These will be updated when fetch completes
    
    // Execute a fresh fetch
    fetchAllSkins();
    if (user) {
      fetchUserSkins();
      fetchUserDefaultSkin();
    } else {
      setUserSkinsLoaded(true);
    }
    
    toast.success("Données des skins réinitialisées");
  }, [fetchAllSkins, fetchUserSkins, fetchUserDefaultSkin, user]);

  const refresh = useCallback(() => {
    if (isRefreshing) return;
    
    console.log("Refreshing skins data");
    
    // Check if we've been retrying too many times
    const currentRetryCount = parseInt(localStorage.getItem(SKINS_RETRY_COUNT_KEY) || '0', 10);
    
    if (currentRetryCount > 5) {
      console.log("Too many retries, doing a complete reset");
      resetSkinsState();
      return;
    }
    
    // Standard refresh
    setLoading(true);
    setSkinsLoaded(false);
    setUserSkinsLoaded(false);
    setFetchError(null);
    
    fetchAllSkins();
    if (user) {
      fetchUserSkins();
      fetchUserDefaultSkin();
    } else {
      setUserSkinsLoaded(true);
    }
  }, [fetchAllSkins, fetchUserSkins, fetchUserDefaultSkin, user, isRefreshing, resetSkinsState]);

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
    fetchError,
    resetSkinsState,
    retryCount
  };
};
