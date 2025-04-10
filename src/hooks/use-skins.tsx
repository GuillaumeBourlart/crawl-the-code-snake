
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { GameSkin, UserSkin } from '@/types/supabase';
import { useAuth } from './use-auth';

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
  const { user, profile } = useAuth();
  
  const [allSkins, setAllSkins] = useState<GameSkin[]>([]);
  const [ownedSkinIds, setOwnedSkinIds] = useState<number[]>([]);
  const [selectedSkinId, setSelectedSkinId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [skinsLoaded, setSkinsLoaded] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [profileSkinsProcessed, setProfileSkinsProcessed] = useState(false);

  const selectedSkin = allSkins.find(skin => skin.id === selectedSkinId) || null;

  // Process profile skins only once when profile is available
  useEffect(() => {
    if (profile && profile.skins && !profileSkinsProcessed) {
      console.log("Processing skins from profile:", profile.skins);
      try {
        // Extract the IDs of skins from the profile skins array
        const skinIds = Array.isArray(profile.skins) 
          ? profile.skins.map(skin => typeof skin === 'number' ? skin : Number(skin))
          : [];
        console.log("Extracted skin IDs from profile:", skinIds);
        setOwnedSkinIds(skinIds);
        setProfileSkinsProcessed(true);
      } catch (error) {
        console.error("Error processing profile skins:", error);
      }
    } else if (!profile) {
      // Reset when profile is not available
      console.log("No profile available, resetting profileSkinsProcessed");
      setProfileSkinsProcessed(false);
    }
  }, [profile, profileSkinsProcessed]);

  // Get all free skins (not paid)
  const freeSkins = allSkins.filter(skin => !skin.is_paid);
  
  // Get paid skins that the user has purchased
  const purchasedSkins = allSkins.filter(skin => 
    skin.is_paid && ownedSkinIds.includes(skin.id)
  );
  
  // All skins that the user can use (free + purchased)
  const availableSkins = [...freeSkins, ...purchasedSkins];
  
  // Paid skins that the user can purchase
  const purchasableSkins = allSkins.filter(skin => 
    skin.is_paid
  );

  const fetchAllSkins = useCallback(async () => {
    if (skinsLoaded) return;
    
    try {
      setLoading(true);
      setFetchError(null);
      console.log("Fetching all skins...");
      
      // Log the exact query we're about to make
      console.log("Query: supabase.from('game_skins').select('*')");
      
      const { data, error } = await supabase
        .from('game_skins')
        .select('*')
        .order('is_paid', { ascending: true })
        .order('id', { ascending: true });

      if (error) {
        console.error("Supabase error fetching skins:", error);
        throw error;
      }
      
      console.log("Fetched all skins, response data:", data);
      
      // Check the structure of the first skin to verify field names
      if (data && data.length > 0) {
        console.log("First skin data structure:", JSON.stringify(data[0], null, 2));
      }
      
      setAllSkins(data as GameSkin[]);
      setSkinsLoaded(true);
    } catch (error: any) {
      console.error('Error fetching skins:', error);
      setFetchError(error);
      toast.error('Erreur de chargement des skins');
    } finally {
      setLoading(false);
    }
  }, [supabase, skinsLoaded]);

  useEffect(() => {
    fetchAllSkins();
  }, [fetchAllSkins]);

  useEffect(() => {
    if (allSkins.length > 0 && !selectedSkinId) {
      const savedSkinId = localStorage.getItem('selected_skin_id');
      if (savedSkinId) {
        const parsedId = parseInt(savedSkinId, 10);
        console.log("Loading selected skin ID from localStorage:", parsedId);
        setSelectedSkinId(parsedId);
      } else if (allSkins[0]) {
        console.log("No skin selected, selecting first available:", allSkins[0].id);
        setSelectedSkinId(allSkins[0].id);
        localStorage.setItem('selected_skin_id', allSkins[0].id.toString());
      }
    }
  }, [allSkins, selectedSkinId]);

  // Fetch user's default skin
  const fetchUserDefaultSkin = useCallback(async () => {
    if (!user) return;
    
    try {
      setFetchError(null);
      console.log("Fetching default skin for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('default_skin_id')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error("Error fetching user default skin:", error);
        throw error;
      }
      
      console.log("User profile data:", data);
      
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

  useEffect(() => {
    if (user) {
      console.log("User detected, loading user-specific skin data");
      fetchUserDefaultSkin();
    }
  }, [user, fetchUserDefaultSkin]);

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
    
    console.log("Setting selected skin to:", skinId);
    setSelectedSkinId(skinId);
    
    localStorage.setItem('selected_skin_id', skinId.toString());
    
    if (user) {
      try {
        console.log("Updating user profile with selected skin:", skinId);
        const { error } = await supabase
          .from('profiles')
          .update({ default_skin_id: skinId })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error updating default skin in profile:', error);
          throw error;
        }
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
    setSkinsLoaded(false);
    setProfileSkinsProcessed(false);
    fetchAllSkins();
    if (user) {
      fetchUserDefaultSkin();
    }
  }, [fetchAllSkins, fetchUserDefaultSkin, user]);

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
    ownedSkinIds
  };
};
