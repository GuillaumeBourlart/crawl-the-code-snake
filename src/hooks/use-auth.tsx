
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase';

const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjAxNCwiZXhwIjoyMDU5MzYyMDE0fQ.K68E3MUX8mU7cnyoHVBHWvy9oVmeaRttsLjhERyenbQ";
const apiUrl = "https://api.grubz.io"; // Using the new API URL

// Create a singleton instance of Supabase client
let supabaseInstance: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true, // Enable session persistence across tabs/refreshes
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
};

// Initialize the singleton
const supabase = getSupabase();

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshSession: () => Promise<void>;
  loading: boolean; // Add loading property to the type
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      console.log("No user ID provided to fetchProfile");
      setLoading(false); // Make sure to set loading to false
      return;
    }
    
    try {
      console.log("Attempting to fetch profile for user:", userId);
      
      // Essayer de récupérer le profil plusieurs fois sur une période de 5 secondes
      let attempts = 0;
      const maxAttempts = 10; // 10 tentatives sur 5 secondes (une tentative toutes les 500ms)
      let profileData = null;
      
      while (attempts < maxAttempts) {
        console.log(`Attempt ${attempts + 1}/${maxAttempts} to fetch profile`);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
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
        setProfile(profileData as Profile);
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
      setLoading(false); // Make sure to set loading to false in finally block
    }
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user data
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
      
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Échec de déconnexion');
      
      // Force reset the state even if sign out failed
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    } finally {
      setLoading(false); // Set loading to false after signOut
    }
  };

  const refreshSession = useCallback(async () => {
  try {
    setLoading(true);
    console.log("Refreshing auth session...");
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log("Session found on refresh:", session.user.id);
      setUser(session.user);
      // On récupère toujours le profil si nécessaire
      await fetchProfile(session.user.id);
    } else {
      console.log("No session found during refresh");
      setUser(null);
      setProfile(null);
    }
  } catch (error) {
    console.error("Error refreshing session:", error);
    setUser(null);
    setProfile(null);
  } finally {
    setLoading(false);
  }
}, [fetchProfile]); // <-- Seulement fetchProfile en dépendance


  useEffect(() => {
    let isMounted = true;
    console.log("Auth provider mounted, initializing...");
    setLoading(true); // Set loading to true when initializing
    
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          console.log("Session found with user:", session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("No session found");
          setUser(null);
          setLoading(false); // Set loading to false if no session
        }
      } catch (error) {
        console.error("Session retrieval error:", error);
        if (isMounted) {
          // If there's an error getting the session, force sign out
          signOut();
          setLoading(false); // Make sure loading is false
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("User signed in:", session.user.id);
          setUser(session.user);
          setProfileFetchAttempted(false); // Reset to allow fetch on new sign in
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          setProfile(null);
          setProfileFetchAttempted(false);
          setLoading(false); // Set loading to false when signed out
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("Token refreshed for user:", session.user.id);
          setUser(session.user);
          if (!profile) {
            await fetchProfile(session.user.id);
          } else {
            setLoading(false); // Set loading to false if profile is already loaded
          }
        }
      }
    );

    // Gestion de la visibilité du document pour actualiser la session lorsque l'utilisateur revient sur l'onglet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Document became visible, refreshing session");
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, refreshSession, profile]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true); // Set loading to true when signing in
      console.log("Attempting to sign in with Google...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        setLoading(false); // Set loading to false on error
        throw error;
      }
      
      console.log("SignInWithGoogle response:", data);
      // Loading will be handled by auth state change

    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Échec de connexion avec Google');
      setLoading(false); // Set loading to false on error
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Non authentifié');
      if (!profile) throw new Error('Profil non disponible');
      
      // Get auth token for the API call
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Non authentifié');
      }
      
      console.log("Updating profile with data:", data);
      
      // Prépare les données à envoyer à l'API
      // Si pseudo n'est pas fourni, utiliser celui du profil actuel
      // Si default_skin_id n'est pas fourni, utiliser celui du profil actuel
      const updateData = {
        userId: user.id,
        pseudo: data.pseudo !== undefined ? data.pseudo : profile.pseudo || "",
        skin_id: data.default_skin_id !== undefined ? data.default_skin_id : profile.default_skin_id || null
      };
      
      console.log("Sending to API:", updateData);
      
      // Call the new API endpoint for updating profile
      const response = await fetch(`${apiUrl}/updateProfile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from API:', errorText);
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Échec de mise à jour du profil');
      }
      
      // Update local state with new data
      setProfile(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Échec de mise à jour du profil');
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('Non authentifié');
      
      // Get auth token for the API call
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Non authentifié');
      }
      
      // Call the API endpoint that will trigger deleteUserAccount - Use DELETE method
      const response = await fetch(`${apiUrl}/deleteAccount`, {
        method: 'DELETE', // Changed from POST to DELETE to match the server endpoint
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from API:', errorText);
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Échec de la suppression');
      }
      
      // Then delete the user auth record
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (userError) throw userError;
      
      // Sign out to clear local state
      await signOut();
      
      toast.success('Votre compte a été supprimé avec succès');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Échec de la suppression du compte');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        supabase,
        signInWithGoogle,
        signOut,
        updateProfile,
        deleteAccount,
        refreshSession,
        loading // Add loading to the context value
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
