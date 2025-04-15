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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'auth-storage',
        storage: {
          getItem: (key) => {
            try {
              const item = localStorage.getItem(key);
              return item;
            } catch {
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              localStorage.setItem(key, value);
            } catch (error) {
              console.error('Error setting auth storage:', error);
            }
          },
          removeItem: (key) => {
            try {
              localStorage.removeItem(key);
            } catch (error) {
              console.error('Error removing auth storage:', error);
            }
          }
        }
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
      setLoading(false);
      return;
    }
    
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Profile fetch timeout'));
      }, 10000); // 10 second timeout
    });
    
    try {
      console.log("Attempting to fetch profile for user:", userId);
      
      const maxAttempts = 3;
      let attempt = 0;
      let profileData = null;
      
      while (attempt < maxAttempts) {
        try {
          const { data, error } = await Promise.race([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single(),
            timeoutPromise
          ]);
          
          if (error) {
            if (error.code === 'PGRST116') {
              // Profile doesn't exist, wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
              attempt++;
              continue;
            }
            throw error;
          }
          
          if (data) {
            profileData = data;
            break;
          }
          
          attempt++;
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          if (error.message === 'Profile fetch timeout') {
            console.error('Profile fetch timeout');
            break;
          }
          throw error;
        }
      }
      
      clearTimeout(timeoutId);
      
      if (profileData) {
        setProfile(profileData as Profile);
      } else {
        console.error("Profile not found after maximum attempts");
        toast.error('Impossible de récupérer votre profil');
        // Don't sign out here, just set profile to null
        setProfile(null);
      }
    } catch (error) {
      console.error('Critical error handling profile:', error);
      toast.error('Problème de connexion au profil');
      setProfile(null);
      // Only sign out for actual auth errors
      if (error.code === 'PGRST401') {
        await signOut();
      }
    } finally {
      setProfileFetchAttempted(true);
      setLoading(false);
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
    // Don't refresh if we're already loading
    if (loading) {
      console.log('Skipping refresh - already loading');
      return;
    }

    let refreshTimeout: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      refreshTimeout = setTimeout(() => {
        reject(new Error('Session refresh timeout'));
      }, 5000);
    });

    try {
      setLoading(true);
      console.log("Refreshing auth session...");
      
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]);

      clearTimeout(refreshTimeout);
      
      if (session?.user) {
        console.log("Session found on refresh:", session.user.id);
        setUser(session.user);
        
        // Only fetch profile if we don't have it or user changed
        if (!profile || profile.id !== session.user.id) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false); // No need to wait for profile fetch
        }
      } else {
        console.log("No session found during refresh");
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
      if (error.message === 'Session refresh timeout') {
        toast.error('Problème de connexion au serveur');
      }
      // Don't clear user/profile on network errors
      if (error.code === 'PGRST401') {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }
  }, [fetchProfile, loading, profile]);

  useEffect(() => {
    let isMounted = true;
    console.log("Auth provider mounted, initializing...");
    setLoading(true);
    
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
          
          // Handle redirect after authentication
          const redirectPath = sessionStorage.getItem('auth_redirect_path');
          if (redirectPath) {
            sessionStorage.removeItem('auth_redirect_path');
            // Only redirect if we're not already on the path
            if (window.location.pathname !== redirectPath) {
              window.location.href = redirectPath;
            }
          }
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

    // Handle document visibility for session refresh
    let visibilityTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Clear any existing timeout
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        // Add a small delay to prevent multiple rapid refreshes
        visibilityTimeout = setTimeout(() => {
          console.log("Document became visible, refreshing session");
          // Only refresh if we have a user
          if (user) {
            refreshSession();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Setup periodic session check
    const sessionCheckInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && user) {
        refreshSession();
      }
    }, 300000); // Check every 5 minutes

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
      clearInterval(sessionCheckInterval);
    };
  }, [fetchProfile, refreshSession]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log("Attempting to sign in with Google...");
      
      const currentPath = window.location.pathname;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${currentPath}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        setLoading(false);
        throw error;
      }
      
      console.log("SignInWithGoogle response:", data);
      // Loading will be handled by auth state change
      
      // Store the current path in sessionStorage for redirect after auth
      sessionStorage.setItem('auth_redirect_path', currentPath);

    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Échec de connexion avec Google');
      setLoading(false);
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
        method: 'DELETE',
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
        loading
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
