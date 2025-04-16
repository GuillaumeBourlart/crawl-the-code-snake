
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameSkin, UserSkin, Profile } from '@/types/supabase';
import { useAuth } from './use-auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const useSkins = () => {
  const { user, profile, supabase, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  // State
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [ownedSkinIds, setOwnedSkinIds] = useState<number[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [skinsLoaded, setSkinsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [profileSkinsProcessed, setProfileSkinsProcessed] = useState(false);
  const [lastSavingMethod, setLastSavingMethod] = useState<string>('none');
  
  // Refs
  const availableSkinsRef = useRef<GameSkin[]>([]);
  const isRefreshingSkinsRef = useRef(false);
  const visibilityListenerAttachedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Computed values
  const selectedSkin = useMemo(() => {
    return allSkins.find(skin => skin.id === selectedSkinId) || null;
  }, [allSkins, selectedSkinId]);

  // Process profile skins when profile changes
  useEffect(() => {
    if (profile && profile.skins && !profileSkinsProcessed) {
      console.log("[useSkins] Processing skins from profile:", profile.skins);
      try {
        let skinIds: number[] = [];
        
        if (Array.isArray(profile.skins)) {
          skinIds = profile.skins
            .filter(skin => skin !== null && skin !== undefined)
            .map(skin => typeof skin === 'number' ? skin : Number(skin))
            .filter(id => !isNaN(id));
        }
        
        console.log("[useSkins] Extracted skin IDs from profile:", skinIds);
        setOwnedSkinIds(skinIds);
        setProfileSkinsProcessed(true);
      } catch (error) {
        console.error("[useSkins] Error processing profile skins:", error);
        setOwnedSkinIds([]);
        setProfileSkinsProcessed(true);
      }
    } else if (!profile) {
      setProfileSkinsProcessed(false);
    }
  }, [profile, profileSkinsProcessed]);

  // Computed skin collections
  const freeSkins = useMemo(() => {
    return allSkins.filter(skin => !skin.is_paid)
      .sort((a, b) => a.id - b.id);
  }, [allSkins]);
  
  const purchasedSkins = useMemo(() => {
    return allSkins.filter(skin => 
      skin.is_paid && ownedSkinIds.includes(skin.id)
    ).sort((a, b) => a.id - b.id);
  }, [allSkins, ownedSkinIds]);
  
  const availableSkins = useMemo(() => {
    const result = [...freeSkins, ...purchasedSkins];
    availableSkinsRef.current = result;
    return result;
  }, [freeSkins, purchasedSkins]);
  
  const purchasableSkins = useMemo(() => {
    return allSkins.filter(skin => 
      skin.is_paid && !ownedSkinIds.includes(skin.id)
    ).sort((a, b) => a.id - b.id);
  }, [allSkins, ownedSkinIds]);

  // Get unified skin list for UI
  const getUnifiedSkinsList = useCallback((): GameSkin[] => {
    if (user) {
      return [...freeSkins, ...purchasedSkins, ...purchasableSkins];
    } else {
      const paidSkins = allSkins.filter(skin => skin.is_paid)
        .sort((a, b) => a.id - b.id);
      return [...freeSkins, ...paidSkins];
    }
  }, [user, freeSkins, purchasedSkins, purchasableSkins, allSkins]);

  // Fetch all skins from Supabase
  const fetchAllSkins = useCallback(async () => {
    if (skinsLoaded) return;
    
    // Prevent concurrent fetches
    if (isRefreshingSkinsRef.current) {
      console.log("[useSkins] Skins refresh already in progress, skipping fetch");
      return;
    }
    
    isRefreshingSkinsRef.current = true;
    
    try {
      setLoading(true);
      setFetchError(null);
      console.log("[useSkins] Fetching all skins...");
      
      // Use Promise.race with timeout to prevent hanging
      const fetchPromise = supabase.from('game_skins').select('*');
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Skins fetch timeout")), 5000)
      );
      
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => ({ data: null, error: new Error("Timeout") }))
      ]);

      if (error) {
        console.error("[useSkins] Supabase error fetching skins:", error);
        throw error;
      }
      
      console.log("[useSkins] Fetched all skins, count:", data?.length || 0);
      
      if (!data || data.length === 0) {
        console.warn("[useSkins] No skins found in database");
        setAllSkins([]);
      } else {
        console.log("[useSkins] First skin data structure:", JSON.stringify(data[0], null, 2));
        setAllSkins(data as GameSkin[]);
      }
      setSkinsLoaded(true);
    } catch (error: any) {
      console.error('[useSkins] Error fetching skins:', error);
      setFetchError(error);
      toast.error(t('error') + ': ' + t('loading'));
      setAllSkins([]);
      setSkinsLoaded(true);
    } finally {
      setLoading(false);
      isRefreshingSkinsRef.current = false;
    }
  }, [supabase, skinsLoaded, t]);

  // Fetch skins when needed
  useEffect(() => {
    if (!skinsLoaded && !isRefreshingSkinsRef.current) {
      fetchAllSkins();
    }
  }, [fetchAllSkins, skinsLoaded]);

  // Reset skins loaded state when auth state changes
  useEffect(() => {
    if (!authLoading) {
      setSkinsLoaded(false);
      setProfileSkinsProcessed(false);
    }
  }, [user, authLoading]);

  // Set initial selected skin
  useEffect(() => {
    if (allSkins.length > 0 && !selectedSkinId) {
      try {
        if (profile?.default_skin_id && allSkins.some(skin => skin.id === profile.default_skin_id)) {
          console.log("[useSkins] Loading selected skin ID from profile:", profile.default_skin_id);
          setSelectedSkinId(profile.default_skin_id);
          localStorage.setItem('selected_skin_id', profile.default_skin_id.toString());
          return;
        }
        
        const savedSkinId = localStorage.getItem('selected_skin_id');
        if (savedSkinId) {
          const parsedId = parseInt(savedSkinId, 10);
          if (!isNaN(parsedId) && allSkins.some(skin => skin.id === parsedId)) {
            console.log("[useSkins] Loading selected skin ID from localStorage:", parsedId);
            setSelectedSkinId(parsedId);
          } else if (allSkins[0]) {
            console.log("[useSkins] Invalid saved skin ID, selecting first available:", allSkins[0].id);
            setSelectedSkinId(allSkins[0].id);
            localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
          }
        } else if (allSkins[0]) {
          console.log("[useSkins] No skin selected, selecting first available:", allSkins[0].id);
          setSelectedSkinId(allSkins[0].id);
          localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
        }
      } catch (error) {
        console.error("[useSkins] Error setting initial skin:", error);
        if (allSkins[0]) {
          setSelectedSkinId(allSkins[0].id);
        }
      }
    }
  }, [allSkins, selectedSkinId, profile]);

  // Update selected skin from profile when it changes
  useEffect(() => {
    if (profile?.default_skin_id && profile.default_skin_id !== selectedSkinId && allSkins.some(skin => skin.id === profile.default_skin_id)) {
      console.log("[useSkins] Setting selected skin from profile default:", profile.default_skin_id);
      setSelectedSkinId(profile.default_skin_id);
      localStorage.setItem('selected_skin_id', profile.default_skin_id.toString());
    }
  }, [profile, selectedSkinId, allSkins]);

  // Handle setting a selected skin
  const setSelectedSkin = async (skinId: number) => {
    const skinExists = allSkins.some(skin => skin.id === skinId);
    
    if (!skinExists) {
      toast.error(t('error') + ": " + "Ce skin n'existe pas");
      return;
    }
    
    const skinData = allSkins.find(skin => skin.id === skinId);
    const isFreeSkin = skinData && !skinData.is_paid;
    const isPurchasedSkin = skinData && skinData.is_paid && ownedSkinIds.includes(skinId);
    
    if (skinData?.is_paid && !isPurchasedSkin && user) {
      toast.error(t('error') + ": " + "Vous ne possédez pas ce skin");
      return;
    }
    
    console.log("[useSkins] Setting selected skin to:", skinId, "Previous skin was:", selectedSkinId);
    setSelectedSkinId(skinId);
    
    try {
      localStorage.setItem('selected_skin_id', skinId.toString());
      setLastSavingMethod('localStorage');
      console.log("[useSkins] Skin saved to localStorage successfully");
    } catch (error) {
      console.error("[useSkins] Error saving skin to localStorage:", error);
    }
  };

  // Utility to get a skin by ID
  const getSkinById = useCallback((id: number | null): GameSkin | null => {
    if (!id) return null;
    return allSkins.find(skin => skin.id === id) || null;
  }, [allSkins]);

  // Manual refresh function
  const refresh = useCallback(() => {
    console.log("[useSkins] Manually refreshing skins data");
    
    // Prevent concurrent refreshes
    if (isRefreshingSkinsRef.current) {
      console.log("[useSkins] Refresh already in progress, skipping manual refresh");
      return;
    }
    
    isRefreshingSkinsRef.current = true;
    setSkinsLoaded(false);
    setProfileSkinsProcessed(false);
    setLoading(true);
    
    fetchAllSkins().finally(() => {
      isRefreshingSkinsRef.current = false;
    });
  }, [fetchAllSkins]);

  // Debug info for troubleshooting
  const getDebugInfo = useCallback(() => {
    return {
      lastSavingMethod,
      selectedSkinId,
      userAuthenticated: !!user,
      profileAvailable: !!profile,
      ownedSkins: ownedSkinIds,
      isRefreshing: isRefreshingSkinsRef.current,
      skinsLoaded
    };
  }, [lastSavingMethod, selectedSkinId, user, profile, ownedSkinIds, skinsLoaded]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    allSkins,
    freeSkins,
    purchasedSkins,
    availableSkins,
    purchasableSkins,
    selectedSkin,
    selectedSkinId,
    setSelectedSkin,
    getSkinById,
    refresh,
    fetchError,
    ownedSkinIds,
    getUnifiedSkinsList,
    getDebugInfo,
    loading
  };
};
