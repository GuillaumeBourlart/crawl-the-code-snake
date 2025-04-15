import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { GameSkin } from '@/types/supabase';
import { useAuth } from './use-auth';
import { useLanguage } from '@/contexts/LanguageContext';

export const useSkins = () => {
  const { user, profile, supabase } = useAuth();
  const { t } = useLanguage();
  
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [ownedSkinIds, setOwnedSkinIds] = useState<number[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [lastSavingMethod, setLastSavingMethod] = useState<string>('none');
  
  const isRefreshingRef = useRef(false);
  const availableSkinsRef = useRef<GameSkin[]>([]);

  const selectedSkin = useMemo(() => {
    return allSkins.find(skin => skin.id === selectedSkinId) || null;
  }, [allSkins, selectedSkinId]);

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

  useEffect(() => {
    if (profile && profile.skins) {
      try {
        let skinIds: number[] = [];
        
        if (Array.isArray(profile.skins)) {
          skinIds = profile.skins
            .filter(skin => skin !== null && skin !== undefined)
            .map(skin => typeof skin === 'number' ? skin : Number(skin))
            .filter(id => !isNaN(id));
        }
        
        setOwnedSkinIds(skinIds);
      } catch (error) {
        console.error("Error processing profile skins:", error);
        setOwnedSkinIds([]);
      }
    }
  }, [profile]);

  const fetchAllSkins = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    try {
      isRefreshingRef.current = true;
      const { data, error } = await supabase
        .from('game_skins')
        .select('*');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setAllSkins([]);
      } else {
        setAllSkins(data as GameSkin[]);
      }
    } catch (error) {
      console.error('Error fetching skins:', error);
      toast.error(t('error') + ': ' + t('loading'));
      setAllSkins([]);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [supabase, t]);

  useEffect(() => {
    fetchAllSkins();
  }, [fetchAllSkins]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isRefreshingRef.current) {
        fetchAllSkins();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAllSkins]);

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
    ownedSkinIds,
    getUnifiedSkinsList,
    getSkinById,
    refresh: fetchAllSkins,
    getDebugInfo
  };
};
