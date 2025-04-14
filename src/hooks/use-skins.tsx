
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { GameSkin, UserSkin, Profile } from '@/types/supabase';
import { useAuth } from './use-auth';

const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjAxNCwiZXhwIjoyMDU5MzYyMDE0fQ.K68E3MUX8mU7cnyoHVBHWvy9oVmeaRttsLjhERyenbQ";
const apiUrl = "https://api.grubz.io"; // Add API URL

let supabaseInstance: any = null;

const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
};

export const useSkins = () => {
  const supabase = getSupabase();
  const { user, profile, signOut } = useAuth();
  
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

  const fetchUserDefaultSkin = useCallback(async () => {
    if (!user) return;
    
    try {
      setFetchError(null);
      console.log("Attempting to fetch default skin for user:", user.id);
      
      // Essayer de récupérer le profil plusieurs fois sur une période de 5 secondes
      let attempts = 0;
      const maxAttempts = 10; // 10 tentatives sur 5 secondes (une tentative toutes les 500ms)
      let profileData = null;
      
      while (attempts < maxAttempts) {
        console.log(`Attempt ${attempts + 1}/${maxAttempts} to fetch profile`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          if (error.code !== 'PGRST116') { // Si c'est une erreur autre que "no rows returned"
            console.error('Database error fetching profile:', error);
            throw error;
          }
        } else if (data) {
          // Profil trouvé
          console.log("Profile retrieved:", data);
          profileData = data;
          break;
        }
        
        // Attendre 500ms avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (profileData) {
        // Update local state instead of trying to call a non-existent setProfile
        console.log("Using profile data:", profileData);
        if (profileData.default_skin_id) {
          setSelectedSkinId(profileData.default_skin_id);
        }
        if (profileData.skins) {
          try {
            let skinIds: number[] = [];
            if (Array.isArray(profileData.skins)) {
              skinIds = profileData.skins
                .filter(skin => skin !== null && skin !== undefined)
                .map(skin => typeof skin === 'number' ? skin : Number(skin))
                .filter(id => !isNaN(id));
            }
            setOwnedSkinIds(skinIds);
          } catch (e) {
            console.error("Error processing skins from profile:", e);
          }
        }
      } else {
        console.error("Profile not found after maximum attempts");
        toast.error('Impossible de récupérer votre profil');
      }
    } catch (error) {
      console.error('Critical error handling profile:', error);
      toast.error('Problème de connexion au profil');
      
      // Critical failure, sign out the user
      await signOut();
    } finally {
      setProfileFetchAttempted(true);
      setLoading(false);
    }
  }, [user, supabase, signOut]);

  useEffect(() => {
    if (user) {
      console.log("User detected, loading user-specific skin data");
      fetchUserDefaultSkin();
    }
  }, [user, fetchUserDefaultSkin]);

  // Improved setSelectedSkin function with better logging and error handling
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
    
    if (!user) {
      // Anonymous user - save to localStorage only
      console.log("Anonymous user: Saving skin to localStorage only");
      setLastSavingMethod("localStorage");
      try {
        localStorage.setItem('selected_skin_id', skinId.toString());
        console.log("Skin saved to localStorage successfully");
      } catch (error) {
        console.error("Error saving skin to localStorage:", error);
      }
      return;
    }
    
    // Logged-in user - save to database
    if (user && profile) {
      console.log("Logged-in user: Updating profile in database with selected skin:", skinId);
      setLastSavingMethod("database");
      
      try {
        const supabase = getSupabase();
        const sessionResponse = await supabase.auth.getSession();
        const accessToken = sessionResponse.data.session?.access_token;
        
        if (!accessToken) {
          console.error("No access token available for database update");
          throw new Error('Non authentifié');
        }
        
        // Récupérer le pseudo actuel du profil pour l'envoyer avec la mise à jour
        const currentPseudo = profile.pseudo || "";
        
        console.log("Sending profile update with:", {
          userId: user.id,
          pseudo: currentPseudo,
          skin_id: skinId
        });
        
        // For debugging: add timestamp to requests to help trace them in network logs
        const timestamp = new Date().toISOString();
        console.log(`API request started at ${timestamp}`);
        
        const response = await fetch(`${apiUrl}/updateProfile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'X-Request-Time': timestamp // Adding custom header for debugging
          },
          body: JSON.stringify({
            userId: user.id,
            pseudo: currentPseudo,
            skin_id: skinId
          })
        });
        
        const responseText = await response.text();
        console.log(`API Response (${timestamp}):`, response.status, responseText);
        
        if (!response.ok) {
          console.error('Error from API:', responseText);
          throw new Error(`Erreur API: ${response.status}`);
        }
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse API response:", e);
          throw new Error("Réponse API invalide");
        }
        
        if (!result.success) {
          console.error("API returned success=false:", result);
          throw new Error(result.message || 'Échec de mise à jour du skin');
        }
        
        console.log("Database update successful, result:", result);
        
        // Also save to localStorage as fallback
        try {
          localStorage.setItem('selected_skin_id', skinId.toString());
          console.log("Skin also saved to localStorage as fallback");
        } catch (error) {
          console.error("Error saving skin to localStorage (fallback):", error);
        }
        
        toast.success("Skin enregistré dans votre profil");
      } catch (error) {
        console.error('Error updating default skin:', error);
        toast.error('Échec de sauvegarde du skin');
        
        // Still update local state
        try {
          localStorage.setItem('selected_skin_id', skinId.toString());
          console.log("Skin saved to localStorage despite API error");
        } catch (storageError) {
          console.error("Error saving skin to localStorage after API error:", storageError);
        }
      }
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
    if (user) {
      fetchUserDefaultSkin();
    }
  }, [fetchAllSkins, fetchUserDefaultSkin, user]);

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
