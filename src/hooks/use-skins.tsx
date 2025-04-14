
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { GameSkin, UserSkin, Profile } from '@/types/supabase';
import { useAuth } from './use-auth';

// No need to create a new client, we'll get it from useAuth
export const useSkins = () => {
  const { user, profile, signOut, updateProfile, supabase } = useAuth();
  
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [ownedSkinIds, setOwnedSkinIds] = useState<number[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [skinsLoaded, setSkinsLoaded] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [profileSkinsProcessed, setProfileSkinsProcessed] = useState(false);
  const [lastSavingMethod, setLastSavingMethod] = useState<string>('none');
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);
  
  const availableSkinsRef = useRef<GameSkin[]>([]);

  const selectedSkin = useMemo(() => {
    return allSkins.find(skin => skin.id === selectedSkinId) || null;
  }, [allSkins, selectedSkinId]);

  useEffect(() => {
    if (profile && profile.skins && !profileSkinsProcessed) {
      console.log("Processing skins from profile:", profile.skins);
      try {
        let skinIds: number[] = [];
        
        if (Array.isArray(profile.skins)) {
          skinIds = profile.skins
            .filter(skin => skin !== null && skin !== undefined)
            .map(skin => typeof skin === 'number' ? skin : Number(skin))
            .filter(id => !isNaN(id));
        }
        
        console.log("Extracted skin IDs from profile:", skinIds);
        setOwnedSkinIds(skinIds);
        setProfileSkinsProcessed(true);
      } catch (error) {
        console.error("Error processing profile skins:", error);
        setOwnedSkinIds([]);
        setProfileSkinsProcessed(true);
      }
    } else if (!profile) {
      setProfileSkinsProcessed(false);
    }
  }, [profile, profileSkinsProcessed]);

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

  const getUnifiedSkinsList = useCallback((): GameSkin[] => {
    if (user) {
      return [...freeSkins, ...purchasedSkins, ...purchasableSkins];
    } else {
      const paidSkins = allSkins.filter(skin => skin.is_paid)
        .sort((a, b) => a.id - b.id);
      return [...freeSkins, ...paidSkins];
    }
  }, [user, freeSkins, purchasedSkins, purchasableSkins, allSkins]);

  const fetchAllSkins = useCallback(async () => {
    if (skinsLoaded) return;
    
    try {
      setLoading(true);
      setFetchError(null);
      console.log("Fetching all skins...");
      
      const { data, error } = await supabase
        .from('game_skins')
        .select('*');

      if (error) {
        console.error("Supabase error fetching skins:", error);
        throw error;
      }
      
      console.log("Fetched all skins, response data:", data);
      
      if (!data || data.length === 0) {
        console.warn("No skins found in database");
        setAllSkins([]);
      } else {
        console.log("First skin data structure:", JSON.stringify(data[0], null, 2));
        setAllSkins(data as GameSkin[]);
      }
      setSkinsLoaded(true);
    } catch (error: any) {
      console.error('Error fetching skins:', error);
      setFetchError(error);
      toast.error('Erreur de chargement des skins');
      setAllSkins([]);
      setSkinsLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [supabase, skinsLoaded]);

  useEffect(() => {
    fetchAllSkins();
  }, [fetchAllSkins]);

  useEffect(() => {
    if (allSkins.length > 0 && !selectedSkinId) {
      try {
        const savedSkinId = localStorage.getItem('selected_skin_id');
        if (savedSkinId) {
          const parsedId = parseInt(savedSkinId, 10);
          if (!isNaN(parsedId) && allSkins.some(skin => skin.id === parsedId)) {
            console.log("Loading selected skin ID from localStorage:", parsedId);
            setSelectedSkinId(parsedId);
          } else if (allSkins[0]) {
            console.log("Invalid saved skin ID, selecting first available:", allSkins[0].id);
            setSelectedSkinId(allSkins[0].id);
            localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
          }
        } else if (allSkins[0]) {
          console.log("No skin selected, selecting first available:", allSkins[0].id);
          setSelectedSkinId(allSkins[0].id);
          localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
        }
      } catch (error) {
        console.error("Error setting initial skin:", error);
        if (allSkins[0]) {
          setSelectedSkinId(allSkins[0].id);
        }
      }
    }
  }, [allSkins, selectedSkinId]);

  useEffect(() => {
    if (profile?.default_skin_id && profile.default_skin_id !== selectedSkinId) {
      console.log("Setting selected skin from profile default:", profile.default_skin_id);
      setSelectedSkinId(profile.default_skin_id);
      localStorage.setItem('selected_skin_id', profile.default_skin_id.toString());
    }
  }, [profile, selectedSkinId]);

  const setSelectedSkin = async (skinId: number) => {
    const skinExists = allSkins.some(skin => skin.id === skinId);
    
    if (!skinExists) {
      toast.error("Ce skin n'existe pas");
      return;
    }
    
    const skinData = allSkins.find(skin => skin.id === skinId);
    const isFreeSkin = skinData && !skinData.is_paid;
    const isPurchasedSkin = skinData && skinData.is_paid && ownedSkinIds.includes(skinId);
    
    if (skinData?.is_paid && !isPurchasedSkin && user) {
      toast.error("Vous ne possédez pas ce skin");
      return;
    }
    
    console.log("Setting selected skin to:", skinId, "Previous skin was:", selectedSkinId);
    setSelectedSkinId(skinId);
    
    // Save to localStorage for all users (including anonymous)
    try {
      localStorage.setItem('selected_skin_id', skinId.toString());
      setLastSavingMethod('localStorage');
      console.log("Skin saved to localStorage successfully");
    } catch (error) {
      console.error("Error saving skin to localStorage:", error);
    }
  };

  const getSkinById = useCallback((id: number | null): GameSkin | null => {
    if (!id) return null;
    return allSkins.find(skin => skin.id === id) || null;
  }, [allSkins]);

  const refresh = useCallback(() => {
    console.log("Refreshing skins data");
    setSkinsLoaded(false);
    setProfileSkinsProcessed(false);
    fetchAllSkins();
  }, [fetchAllSkins]);

  // Debug function to get last update info
  const getDebugInfo = useCallback(() => {
    return {
      lastSavingMethod,
      selectedSkinId,
      userAuthenticated: !!user,
      profileAvailable: !!profile,
      ownedSkins: ownedSkinIds
    };
  }, [lastSavingMethod, selectedSkinId, user, profile, ownedSkinIds]);

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
    ownedSkinIds,
    getUnifiedSkinsList,
    getDebugInfo
  };
};
