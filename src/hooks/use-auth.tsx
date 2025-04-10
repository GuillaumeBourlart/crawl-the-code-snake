
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase';

const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjAxNCwiZXhwIjoyMDU5MzYyMDE0fQ.K68E3MUX8mU7cnyoHVBHWvy9oVmeaRttsLjhERyenbQ";

// Local storage keys
const SESSION_ERROR_KEY = 'auth_session_error';
const SESSION_LOAD_TIMESTAMP_KEY = 'auth_session_load_timestamp';

// Create Supabase client instance as a singleton to avoid duplicate instances
let supabaseInstance: SupabaseClient | null = null;
const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    console.log("Created new Supabase client instance");
  }
  return supabaseInstance;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  authInitialized: boolean; // New flag to track initial auth load completion
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  forceSignOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetAuthState: () => Promise<void>; // New emergency reset function
  sessionError: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the Supabase client once
const supabase = getSupabaseClient();

// Helper to check if a session might be stuck
const checkForStuckSession = (): boolean => {
  const errorTimestamp = localStorage.getItem(SESSION_ERROR_KEY);
  const loadTimestamp = localStorage.getItem(SESSION_LOAD_TIMESTAMP_KEY);
  
  if (errorTimestamp) {
    const errorTime = parseInt(errorTimestamp, 10);
    const now = Date.now();
    
    // If there was an error in the last 10 minutes
    if (now - errorTime < 10 * 60 * 1000) {
      console.log("Detected recent auth error, session might be stuck");
      return true;
    } else {
      // Clear old error timestamps
      localStorage.removeItem(SESSION_ERROR_KEY);
    }
  }
  
  if (loadTimestamp) {
    const loadTime = parseInt(loadTimestamp, 10);
    const now = Date.now();
    
    // If loading started more than 30 seconds ago and never completed
    if (now - loadTime > 30 * 1000) {
      console.log("Detected stale loading state, session might be stuck");
      return true;
    }
  }
  
  return false;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);
  const [initialSessionCheckDone, setInitialSessionCheckDone] = useState(false);
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Record loading start time
  useEffect(() => {
    if (loading && !authInitialized) {
      localStorage.setItem(SESSION_LOAD_TIMESTAMP_KEY, Date.now().toString());
    } else if (!loading) {
      localStorage.removeItem(SESSION_LOAD_TIMESTAMP_KEY);
    }
  }, [loading, authInitialized]);

  // Complete reset of auth state - for emergency use
  const resetAuthState = async () => {
    console.log("EMERGENCY: Resetting entire auth state");
    try {
      setLoading(true);
      
      // Clear all auth-related localStorage items
      localStorage.removeItem(SESSION_ERROR_KEY);
      localStorage.removeItem(SESSION_LOAD_TIMESTAMP_KEY);
      localStorage.removeItem('supabase.auth.token');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Reset all state
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
      setAuthInitialized(false);
      setInitialSessionCheckDone(false);
      setSessionError(null);
      
      // Force refresh the Supabase client
      supabaseInstance = null;
      const newClient = getSupabaseClient();
      
      // Reinitialize session
      const { data: { session }, error } = await newClient.auth.getSession();
      if (error) {
        console.log("Clean session check after reset - no session found");
      }
      
      toast.success('État d\'authentification réinitialisé');
    } catch (error) {
      console.error("Error during auth state reset:", error);
    } finally {
      setLoading(false);
      setAuthInitialized(true);
    }
  };

  // Check for stuck session at init
  useEffect(() => {
    const isStuck = checkForStuckSession();
    if (isStuck) {
      console.log("Detected potentially stuck session at startup, resetting");
      resetAuthState();
    }
  }, []);

  // Explicitly refresh the session
  const refreshSession = async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      console.log("Explicitly refreshing session state");
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session refresh error:", error);
        setSessionError(error);
        localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
        throw error;
      }
      
      if (session?.user) {
        console.log("Session refreshed with user:", session.user.id);
        setUser(session.user);
        setSessionError(null);
        
        if (!profile) {
          await fetchProfile(session.user.id);
        }
      } else {
        console.log("No session found during refresh");
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
      setAuthInitialized(true);
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!userId) {
      console.log("No user ID provided to fetchProfile");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Database error fetching profile:', error);
          setSessionError(error);
          localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
          throw error;
        }
        
        console.log("No profile found, creating new profile for user:", userId);
        const newProfile: Profile = {
          id: userId,
          pseudo: `Player_${Math.floor(Math.random() * 10000)}`,
          skins: [],
          created_at: new Date().toISOString()
        };
        
        console.log("Attempting to insert profile:", newProfile);
        const { error: insertError, data: insertData } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select();
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
          setSessionError(insertError);
          localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
          throw insertError;
        }
        
        console.log("Profile insertion response:", insertData);
        
        if (insertData && insertData.length > 0) {
          console.log("Using inserted profile data:", insertData[0]);
          setProfile(insertData[0] as Profile);
          setSessionError(null);
        } else {
          const { data: newData, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (refetchError) {
            console.error('Error fetching created profile:', refetchError);
            setSessionError(refetchError);
            localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
            throw refetchError;
          }
          
          console.log("New profile created and fetched:", newData);
          setProfile(newData as Profile);
          setSessionError(null);
        }
      } else {
        console.log("Profile retrieved:", data);
        setProfile(data as Profile);
        setSessionError(null);
      }
    } catch (error) {
      console.error('Critical error handling profile:', error);
      toast.error('Problème de connexion au profil');
      
      // Ne pas se déconnecter automatiquement, laisser l'utilisateur choisir
      setSessionError(error as Error);
    } finally {
      setProfileFetchAttempted(true);
      setLoading(false);
      setAuthInitialized(true);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
      setSessionError(null);
      
      // Clear any error records
      localStorage.removeItem(SESSION_ERROR_KEY);
      
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Échec de déconnexion');
      
      // Record the error
      localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
      
      // Nettoyage des états même en cas d'erreur
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    } finally {
      setLoading(false);
    }
  };

  const forceSignOut = async () => {
    try {
      console.log("Force signing out user");
      setLoading(true);
      await supabase.auth.signOut();
      
      // Clear all auth-related localStorage
      localStorage.removeItem(SESSION_ERROR_KEY);
      localStorage.removeItem(SESSION_LOAD_TIMESTAMP_KEY);
      localStorage.removeItem('supabase.auth.token');
      
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
      setSessionError(null);
    } catch (error) {
      console.error('Error force signing out:', error);
      
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Set a safety timeout to prevent blocked loading state
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading && !authInitialized) {
        console.log("Safety timeout triggered - forcing auth initialization");
        setLoading(false);
        setAuthInitialized(true);
        setSessionError(new Error("L'authentification a pris trop de temps"));
        localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
      }
    }, 10000); // 10 second safety timeout
    
    const getSession = async () => {
      try {
        console.log("Checking for existing session...");
        setLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          setSessionError(sessionError);
          localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
          throw sessionError;
        }
        
        if (session?.user) {
          console.log("Session found with user:", session.user.id);
          setUser(session.user);
          setSessionError(null);
          await fetchProfile(session.user.id);
        } else {
          console.log("No session found");
          setUser(null);
          setLoading(false);
          setAuthInitialized(true);
        }
        
        setInitialSessionCheckDone(true);
      } catch (error) {
        console.error("Session retrieval error:", error);
        if (isMounted) {
          setSessionError(error as Error);
          setLoading(false);
          setInitialSessionCheckDone(true);
          setAuthInitialized(true);
          localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
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
          setProfileFetchAttempted(false);
          setSessionError(null);
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          setProfile(null);
          setProfileFetchAttempted(false);
          setLoading(false);
          setAuthInitialized(true);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("Token refreshed for user:", session.user.id);
          setUser(session.user);
          setSessionError(null);
          // Don't refetch profile on token refresh to avoid unnecessary database calls
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Add visibility change handler to refresh session when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible, refreshing session");
        
        // Check if we might be in a stuck state
        if (loading || sessionError) {
          console.log("Auth state may be stuck, doing a more aggressive refresh");
          
          // If we were loading for more than 10 seconds or have an error, 
          // do a more aggressive refresh
          if (loading && localStorage.getItem(SESSION_LOAD_TIMESTAMP_KEY)) {
            const loadTime = parseInt(localStorage.getItem(SESSION_LOAD_TIMESTAMP_KEY) || '0', 10);
            const now = Date.now();
            
            if (now - loadTime > 10000) {
              console.log("Loading state appears stuck for more than 10s, forcing reset");
              setLoading(false); // Force loading to false first
              await refreshSession();
            }
          } else {
            // If we're not in a prolonged loading state but have an error
            await refreshSession();
          }
        } else if (initialSessionCheckDone) {
          // Normal refresh for stable state
          await refreshSession();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initialSessionCheckDone, loading, sessionError]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log("Attempting to sign in with Google...");
      
      // Clear any previous error state
      setSessionError(null);
      localStorage.removeItem(SESSION_ERROR_KEY);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        setSessionError(error);
        localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
        throw error;
      }
      
      console.log("SignInWithGoogle response:", data);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Échec de connexion avec Google');
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Non authentifié');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) {
        setSessionError(error);
        localStorage.setItem(SESSION_ERROR_KEY, Date.now().toString());
        throw error;
      }
      
      setProfile(prev => prev ? { ...prev, ...data } : null);
      setSessionError(null);
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Échec de mise à jour du profil');
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
        loading,
        authInitialized,
        updateProfile,
        forceSignOut,
        refreshSession,
        resetAuthState,
        sessionError
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
