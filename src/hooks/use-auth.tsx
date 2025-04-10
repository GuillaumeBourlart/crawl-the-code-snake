
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase';

const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjAxNCwiZXhwIjoyMDU5MzYyMDE0fQ.K68E3MUX8mU7cnyoHVBHWvy9oVmeaRttsLjhERyenbQ";

// Session error tracking in localStorage
const SESSION_ERROR_KEY = 'auth_session_error';
const MAX_SESSION_ERRORS = 3;
const SESSION_ERROR_RESET_TIME = 30 * 60 * 1000; // 30 minutes

// Create Supabase client instance as a singleton to avoid duplicate instances
let supabaseInstance: SupabaseClient | null = null;
const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Changed to false to test if it fixes the issues
        autoRefreshToken: true,
      }
    });
    console.log("Created new Supabase client instance with persistSession: false");
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
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  forceSignOut: () => Promise<void>;
  resetAuthState: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the Supabase client once
const supabase = getSupabaseClient();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);
  const [initialSessionCheckDone, setInitialSessionCheckDone] = useState(false);
  const [sessionCheckError, setSessionCheckError] = useState<Error | null>(null);
  const visibilityChangeTimeRef = useRef<number>(0);
  const loadingTimerRef = useRef<number | null>(null);
  const sessionErrorCountRef = useRef<number>(0);
  const lastSessionCheckRef = useRef<number>(Date.now());
  const authOperationInProgressRef = useRef<boolean>(false);

  // Function to track session errors in localStorage
  const trackSessionError = useCallback(() => {
    try {
      const now = Date.now();
      const storedErrors = localStorage.getItem(SESSION_ERROR_KEY);
      let errors: number[] = storedErrors ? JSON.parse(storedErrors) : [];
      
      // Remove errors older than SESSION_ERROR_RESET_TIME
      errors = errors.filter(timestamp => now - timestamp < SESSION_ERROR_RESET_TIME);
      
      // Add current error
      errors.push(now);
      localStorage.setItem(SESSION_ERROR_KEY, JSON.stringify(errors));
      
      // Update ref for current component instance
      sessionErrorCountRef.current = errors.length;
      
      return errors.length;
    } catch (error) {
      console.error("Error tracking session errors:", error);
      return 0;
    }
  }, []);

  // Check for excessive session errors
  const checkExcessiveSessionErrors = useCallback(() => {
    try {
      const now = Date.now();
      const storedErrors = localStorage.getItem(SESSION_ERROR_KEY);
      if (!storedErrors) return false;
      
      const errors: number[] = JSON.parse(storedErrors);
      const recentErrors = errors.filter(timestamp => now - timestamp < SESSION_ERROR_RESET_TIME);
      
      sessionErrorCountRef.current = recentErrors.length;
      return recentErrors.length >= MAX_SESSION_ERRORS;
    } catch (error) {
      console.error("Error checking session errors:", error);
      return false;
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      console.log("No user ID provided to fetchProfile");
      setLoading(false);
      return;
    }
    
    // Prevent concurrent profile fetches
    if (authOperationInProgressRef.current) {
      console.log("Auth operation already in progress, skipping profile fetch");
      return;
    }
    
    // Update last session check timestamp
    lastSessionCheckRef.current = Date.now();
    
    try {
      console.log("Fetching profile for user:", userId);
      authOperationInProgressRef.current = true;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Database error fetching profile:', error);
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
          throw insertError;
        }
        
        console.log("Profile insertion response:", insertData);
        
        if (insertData && insertData.length > 0) {
          console.log("Using inserted profile data:", insertData[0]);
          setProfile(insertData[0] as Profile);
        } else {
          const { data: newData, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (refetchError) {
            console.error('Error fetching created profile:', refetchError);
            throw refetchError;
          }
          
          console.log("New profile created and fetched:", newData);
          setProfile(newData as Profile);
        }
      } else {
        console.log("Profile retrieved:", data);
        setProfile(data as Profile);
      }
    } catch (error) {
      console.error('Critical error handling profile:', error);
      toast.error('Problème de connexion au profil');
      
      // Track session error for pattern detection
      const errorCount = trackSessionError();
      console.log(`Session error count: ${errorCount}/${MAX_SESSION_ERRORS}`);
      
      if (errorCount >= MAX_SESSION_ERRORS) {
        toast.error('Problèmes de connexion répétés. Déconnexion pour sécurité.');
        forceSignOut();
      }
      
      // Ne pas se déconnecter automatiquement, laisser l'utilisateur choisir
      setSessionCheckError(error as Error);
    } finally {
      setProfileFetchAttempted(true);
      setLoading(false);
      authOperationInProgressRef.current = false;
    }
  }, [trackSessionError]);

  const signOut = useCallback(async () => {
    // Prevent concurrent auth operations
    if (authOperationInProgressRef.current) {
      console.log("Auth operation already in progress, skipping sign out");
      return;
    }
    
    try {
      setLoading(true);
      authOperationInProgressRef.current = true;
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
      
      // Clear session error tracking
      localStorage.removeItem(SESSION_ERROR_KEY);
      sessionErrorCountRef.current = 0;
      
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Échec de déconnexion');
      
      // Nettoyage des états même en cas d'erreur
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    } finally {
      setLoading(false);
      authOperationInProgressRef.current = false;
    }
  }, []);

  const forceSignOut = useCallback(async () => {
    // Prevent concurrent auth operations
    if (authOperationInProgressRef.current) {
      console.log("Auth operation already in progress, skipping force sign out");
      return;
    }
    
    try {
      console.log("Force signing out user");
      setLoading(true);
      authOperationInProgressRef.current = true;
      
      await supabase.auth.signOut();
      
      // Clear all auth state
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
      
      // Clear session error tracking
      localStorage.removeItem(SESSION_ERROR_KEY);
      sessionErrorCountRef.current = 0;
      
      toast.info("Déconnexion forcée pour résoudre les problèmes de session");
    } catch (error) {
      console.error('Error force signing out:', error);
      
      // Reset state even if sign out fails
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    } finally {
      setLoading(false);
      authOperationInProgressRef.current = false;
    }
  }, []);

  // New function to reset auth state without sign out
  const resetAuthState = useCallback(() => {
    console.log("Resetting auth state manually");
    
    // Clear any pending timers
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    // Reset operation in progress flag
    authOperationInProgressRef.current = false;
    
    // Reset loading state
    setLoading(false);
    
    // Trigger a new session check if we have a user
    if (user) {
      console.log("Re-fetching session and profile data for current user");
      fetchProfile(user.id);
    }
    
    toast.info("État d'authentification réinitialisé");
  }, [user, fetchProfile]);

  // Check session on initial load and set up auth state listener
  useEffect(() => {
    let isMounted = true;
    
    // Function to check for existing session
    const getSession = async () => {
      // Prevent duplicate session checks
      if (authOperationInProgressRef.current) {
        console.log("Auth operation already in progress, skipping session check");
        return;
      }
      
      // Check if we have excessive session errors first
      if (checkExcessiveSessionErrors()) {
        console.log("Excessive session errors detected, forcing sign out");
        await forceSignOut();
        return;
      }
      
      try {
        console.log("Checking for existing session...");
        setLoading(true);
        authOperationInProgressRef.current = true;
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session?.user) {
          console.log("Session found with user:", session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("No session found");
          setUser(null);
          setLoading(false);
        }
        
        setInitialSessionCheckDone(true);
      } catch (error) {
        console.error("Session retrieval error:", error);
        
        if (isMounted) {
          setSessionCheckError(error as Error);
          setLoading(false);
          setInitialSessionCheckDone(true);
          
          // Track session error
          trackSessionError();
        }
      } finally {
        if (isMounted) {
          authOperationInProgressRef.current = false;
        }
      }
    };

    getSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("User signed in:", session.user.id);
          setUser(session.user);
          setProfileFetchAttempted(false);
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setUser(null);
          setProfile(null);
          setProfileFetchAttempted(false);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("Token refreshed for user:", session.user.id);
          setUser(session.user);
          
          // Check if it's been a while since our last profile check
          const now = Date.now();
          const timeSinceLastCheck = now - lastSessionCheckRef.current;
          const TOKEN_REFRESH_PROFILE_CHECK_THRESHOLD = 5 * 60 * 1000; // 5 minutes
          
          if (timeSinceLastCheck > TOKEN_REFRESH_PROFILE_CHECK_THRESHOLD) {
            console.log("It's been a while since profile check, refreshing profile data");
            await fetchProfile(session.user.id);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, forceSignOut, checkExcessiveSessionErrors, trackSessionError]);

  // Tab visibility change handler with improved stability
  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      
      // Throttle visibility change events to prevent multiple consecutive triggers
      if (now - visibilityChangeTimeRef.current < 1000) {
        console.log("Ignoring rapid visibility change event");
        return;
      }
      
      visibilityChangeTimeRef.current = now;
      
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible, checking session state");
        
        // Clear any existing loading reset timer
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
        }
        
        // Reset loading state if it's been stuck for too long
        loadingTimerRef.current = window.setTimeout(() => {
          if (loading) {
            console.log("Loading state was stuck, resetting and refreshing data");
            authOperationInProgressRef.current = false;
            setLoading(false);
            
            // If we have a user, verify their session and profile
            if (user) {
              console.log("User exists, refreshing profile data");
              fetchProfile(user.id);
            } else {
              // If no user, check if there might be a session we didn't catch
              console.log("No user, checking for session");
              supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                  console.log("Found session for user:", session.user.id);
                  setUser(session.user);
                  fetchProfile(session.user.id);
                }
              }).catch(error => {
                console.error("Error checking session on visibility change:", error);
              });
            }
          }
          loadingTimerRef.current = null;
        }, 2000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [loading, user, fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    // Prevent concurrent auth operations
    if (authOperationInProgressRef.current) {
      console.log("Auth operation already in progress, skipping Google sign in");
      return;
    }
    
    try {
      setLoading(true);
      authOperationInProgressRef.current = true;
      console.log("Attempting to sign in with Google...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
      
      console.log("SignInWithGoogle response:", data);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Échec de connexion avec Google');
      setLoading(false);
      authOperationInProgressRef.current = false;
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    // Prevent concurrent auth operations
    if (authOperationInProgressRef.current) {
      console.log("Auth operation already in progress, skipping profile update");
      return;
    }
    
    try {
      if (!user) throw new Error('Non authentifié');
      
      authOperationInProgressRef.current = true;
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profil mis à jour');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Échec de mise à jour du profil');
    } finally {
      authOperationInProgressRef.current = false;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        supabase,
        signInWithGoogle,
        signOut,
        loading,
        updateProfile,
        forceSignOut,
        resetAuthState,
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
