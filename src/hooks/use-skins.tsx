import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { GameSkin, UserSkin, Profile } from '@/types/supabase';
import { useAuth } from './use-auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { eventBus, EVENTS } from '@/lib/event-bus';
import loadingState from '@/lib/loading-states';

export const useSkins = () => {
  const { user, profile, signOut, updateProfile, supabase, refreshSession } = useAuth();
  const { t } = useLanguage();
  
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [ownedSkinIds, setOwnedSkinIds] = useState<number[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [skinsLoaded, setSkinsLoaded] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [profileSkinsProcessed, setProfileSkinsProcessed] = useState(false);
  const [lastSavingMethod, setLastSavingMethod] = useState<string>('none');
  
  const availableSkinsRef = useRef<GameSkin[]>([]);

  const selectedSkin = useMemo(() => {
    return allSkins.find(skin => skin.id === selectedSkinId) || null;
  }, [allSkins, selectedSkinId]);

  useEffect(() => {
    // Use our event bus instead of direct DOM event listeners
    const subscription = eventBus.subscribe(EVENTS.DOCUMENT_BECAME_VISIBLE, async () => {
      console.log("Document visible, refreshing skins data via event bus");
      if (user) {
        console.log("User detected, refreshing skins data with user context");
        try {
          await refreshSession();
          setSkinsLoaded(false);
          setProfileSkinsProcessed(false);
          await fetchAllSkins(); // Immediately fetch skins after resetting states
        } catch (error) {
          console.error("Error refreshing skins on visibility change:", error);
        }
      } else {
        setSkinsLoaded(false);
        await fetchAllSkins(); // Fetch skins even when not logged in
      }
    });
    
    // Also listen for auth state changes
    const authSubscription = eventBus.subscribe(EVENTS.AUTH_PROFILE_LOADED, () => {
      console.log("Profile loaded, refreshing skins data");
      setSkinsLoaded(false);
      setProfileSkinsProcessed(false);
      fetchAllSkins();
    });
    
    return () => {
      subscription.unsubscribe();
      authSubscription.unsubscribe();
    };
  }, [user, refreshSession, fetchAllSkins]);

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
    
    return loadingState.executeOnce('fetch_all_skins', async () => {
      try {
        setLoading(true); // Set loading to true when fetching
        setFetchError(null);
        console.log("Fetching all skins...");
        
        // Emit event to notify other components
        eventBus.emit(EVENTS.SKINS_LOADING);
        
        const { data, error } = await Promise.race([
          supabase.from('game_skins').select('*'),
          new Promise((_, reject) => setTimeout(() => 
            reject(new Error('Skin fetch timeout')), 10000)
          )
        ]);

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
          
          // Emit event with the fetched skins
          eventBus.emit(EVENTS.SKINS_LOADED, { skins: data });
        }
        
        setSkinsLoaded(true);
        return data;
      } catch (error: unknown) {
        console.error('Error fetching skins:', error);
        setFetchError(error);
        toast.error(t('error') + ': ' + t('loading'));
        setAllSkins([]);
        setSkinsLoaded(true);
        
        // Emit error event
        eventBus.emit(EVENTS.SKINS_ERROR, { error });
        
        return null;
      } finally {
        setLoading(false); // Set loading to false in finally block
      }
    });
  }, [supabase, skinsLoaded, t]);

  useEffect(() => {
    fetchAllSkins();
  }, [fetchAllSkins]);

  useEffect(() => {
    if (allSkins.length > 0) {
      try {
        // First priority: use profile's default skin if available and valid
        if (profile?.default_skin_id && allSkins.some(skin => skin.id === profile.default_skin_id)) {
          console.log("Loading selected skin ID from profile:", profile.default_skin_id);
          setSelectedSkinId(profile.default_skin_id);
          localStorage.setItem('selected_skin_id', profile.default_skin_id.toString());
          return;
        }
        
        // Second priority: use localStorage if available and valid
        const savedSkinId = localStorage.getItem('selected_skin_id');
        if (savedSkinId) {
          const parsedId = parseInt(savedSkinId, 10);
          if (!isNaN(parsedId) && allSkins.some(skin => skin.id === parsedId)) {
            console.log("Loading selected skin ID from localStorage:", parsedId);
            setSelectedSkinId(parsedId);
            return;
          }
        }

        // Last resort: use first available skin
        if (allSkins[0]) {
          console.log("No valid skin selected, selecting first available:", allSkins[0].id);
          setSelectedSkinId(allSkins[0].id);
          localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
        }
      } catch (error) {
        console.error("Error setting initial skin:", error);
        if (allSkins[0]) {
          setSelectedSkinId(allSkins[0].id);
          localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
        }
      }
    }
  }, [allSkins, profile]);

  useEffect(() => {
    if (profile?.default_skin_id && profile.default_skin_id !== selectedSkinId && allSkins.some(skin => skin.id === profile.default_skin_id)) {
      console.log("Setting selected skin from profile default:", profile.default_skin_id);
      setSelectedSkinId(profile.default_skin_id);
      localStorage.setItem('selected_skin_id', profile.default_skin_id.toString());
    }
  }, [profile, selectedSkinId, allSkins]);

  const setSelectedSkin = useCallback(async (skinId: number) => {
    return loadingState.executeOnce(`select_skin_${skinId}`, async () => {
      try {
        console.log("Attempting to set skin ID:", skinId, "Current skins loaded:", allSkins.length);
        const skinExists = allSkins.some(skin => skin.id === skinId);
        
        if (!skinExists) {
          const errorMsg = "Ce skin n'existe pas";
          console.error("Skin selection error: Skin doesn't exist", { skinId, availableSkins: allSkins.map(s => s.id) });
          toast.error(t('error') + ": " + errorMsg);
          eventBus.emit(EVENTS.SKINS_ERROR, { 
            type: 'invalid_skin_selection', 
            error: new Error(errorMsg)
          });
          return false;
        }
        
        const skinData = allSkins.find(skin => skin.id === skinId);
        const isFreeSkin = skinData && !skinData.is_paid;
        const isPurchasedSkin = skinData && skinData.is_paid && ownedSkinIds.includes(skinId);
        
        if (skinData?.is_paid && !isPurchasedSkin && user) {
          const errorMsg = "Vous ne possédez pas ce skin";
          console.error("Skin selection error: User doesn't own the skin", { 
            skinId, 
            isPaid: skinData?.is_paid,
            ownedSkins: ownedSkinIds 
          });
          toast.error(t('error') + ": " + errorMsg);
          eventBus.emit(EVENTS.SKINS_ERROR, { 
            type: 'unpurchased_skin_selection', 
            error: new Error(errorMsg)
          });
          return false;
        }
        
        console.log("Setting selected skin to:", skinId, "Previous skin was:", selectedSkinId);
        setSelectedSkinId(skinId);
        
        // Emit event before completing persistence actions
        eventBus.emit(EVENTS.SKIN_SELECTED, { skinId, skinData });
        
        // Always save to localStorage first for immediate access
        try {
          localStorage.setItem('selected_skin_id', skinId.toString());
          console.log("Skin saved to localStorage successfully");
          setLastSavingMethod('localStorage');
        } catch (error) {
          console.error("Error saving skin to localStorage:", error);
          eventBus.emit(EVENTS.SKINS_ERROR, {
            type: 'localStorage_save_failed',
            error
          });
        }
        
        // If user is authenticated, also update profile in database
        if (user && profile && updateProfile) {
          try {
            console.log("Updating profile with new default skin ID:", skinId);
            await updateProfile({
              ...profile,
              default_skin_id: skinId
            });
            console.log("Profile updated with new skin successfully");
            setLastSavingMethod('profile');
          } catch (error) {
            console.error("Error updating profile with selected skin:", error);
            // Don't show toast here as localStorage save already succeeded
            eventBus.emit(EVENTS.SKINS_ERROR, {
              type: 'profile_skin_update_failed',
              error
            });
            // Profile update failed but localStorage succeeded, so overall result is still success
          }
        }
        
        return true;
      } catch (error) {
        console.error("Error setting selected skin:", error);
        eventBus.emit(EVENTS.SKINS_ERROR, {
          type: 'skin_selection_failed',
          error
        });
        return false;
      }
    });
  }, [allSkins, ownedSkinIds, user, t, selectedSkinId, profile, updateProfile]);

  const getSkinById = useCallback((id: number | null): GameSkin | null => {
    if (!id) return null;
    return allSkins.find(skin => skin.id === id) || null;
  }, [allSkins]);

  const refresh = useCallback(async () => {
    return loadingState.executeOnce('refresh_skins', async () => {
      try {
        console.log("Refreshing skins data");
        eventBus.emit(EVENTS.SKINS_REFRESHING);
        
        // Force clear any cached state
        setSkinsLoaded(false);
        setProfileSkinsProcessed(false);
        setLoading(true); 
        loadingState.clearLoadingState('fetch_all_skins');
        
        // Store current selectedSkinId to restore after refresh
        const currentSelectedSkinId = selectedSkinId;
        
        // Force reload session and profile data
        if (user) {
          try {
            await refreshSession();
          } catch (sessionError) {
            console.error("Error refreshing session during skin refresh:", sessionError);
          }
        }
        
        const result = await fetchAllSkins();
        
        // Restore selected skin if it still exists after refresh
        if (currentSelectedSkinId && result && Array.isArray(result)) {
          const skinStillExists = result.some(skin => skin.id === currentSelectedSkinId);
          if (skinStillExists && currentSelectedSkinId !== selectedSkinId) {
            console.log("Restoring previously selected skin after refresh:", currentSelectedSkinId);
            setSelectedSkinId(currentSelectedSkinId);
            localStorage.setItem('selected_skin_id', currentSelectedSkinId.toString());
          }
        }
        
        console.log("Skins refresh complete");
        eventBus.emit(EVENTS.SKINS_REFRESH_COMPLETE, { success: true });
        return result;
      } catch (error) {
        console.error("Error refreshing skins:", error);
        eventBus.emit(EVENTS.SKINS_ERROR, { 
          type: 'refresh_failed', 
          error 
        });
        return null;
      } finally {
        setLoading(false);
      }
    });
  }, [fetchAllSkins, selectedSkinId, user, refreshSession]);

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
    getSkinById,
    refresh,
    fetchError,
    ownedSkinIds,
    getUnifiedSkinsList,
    getDebugInfo,
    loading // Add loading to the returned object
  };
};
