
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase';

// Supabase configuration
const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjAxNCwiZXhwIjoyMDU5MzYyMDE0fQ.K68E3MUX8mU7cnyoHVBHWvy9oVmeaRttsLjhERyenbQ";
const apiUrl = "https://api.grubz.io";

// Create a singleton instance of Supabase client
let supabaseInstance: SupabaseClient | null = null;

const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
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
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refs to track ongoing operations and prevent duplicates
  const isRefreshingRef = useRef(false);
  const profileFetchInProgressRef = useRef(false);
  const visibilityListenerAttachedRef = useRef(false);
  const sessionInitializedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Simple debounce utility
  const debounce = useCallback((func: Function, wait: number) => {
    return (...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => func(...args), wait);
    };
  }, []);
  
  // Profile fetching with locks and timeouts
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (!userId) {
      console.log("[fetchProfile] No userId provided");
      return null;
    }
    
    // Prevent concurrent fetches
    if (profileFetchInProgressRef.current) {
      console.log("[fetchProfile] A profile fetch is already in progress for", userId);
      return null;
    }
    
    profileFetchInProgressRef.current = true;
    console.log("[fetchProfile] Starting profile fetch for user:", userId);
    
    try {
      // Use Promise.race with timeout to prevent hanging
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Profile fetch timeout")), 5000)
      );
      
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => ({ data: null, error: new Error("Timeout") }))
      ]);
      
      if (error) {
        console.error("[fetchProfile] Error fetching profile:", error);
        return null;
      }
      
      if (data) {
        console.log("[fetchProfile] Profile successfully fetched:", data);
        setProfile(data as Profile);
        return data as Profile;
      }
      
      return null;
    } catch (error) {
      console.error("[fetchProfile] Unexpected error during profile fetch:", error);
      return null;
    } finally {
      profileFetchInProgressRef.current = false;
      console.log("[fetchProfile] Profile fetch completed, lock released");
    }
  }, []);

  // Session refresh with lock mechanism and timeout
  const refreshSession = useCallback(async (): Promise<void> => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log("[refreshSession] A refresh is already in progress, skipping");
      return;
    }
    
    isRefreshingRef.current = true;
    console.log("[refreshSession] Starting session refresh");
    
    try {
      setLoading(true);
      
      // Use Promise.race with timeout to prevent hanging
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Session refresh timeout")), 5000)
      );
      
      const { data: { session } } = await Promise.race([
        sessionPromise,
        timeoutPromise.then(() => ({ data: { session: null } }))
      ]);
      
      console.log("[refreshSession] Session result:", session?.user?.id || "No session");
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error("[refreshSession] Error refreshing session:", error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
      isRefreshingRef.current = false;
      console.log("[refreshSession] Refresh completed, lock released");
    }
  }, [fetchProfile]);

  // Create debounced version
  const debouncedRefreshSession = useCallback(
    debounce(() => {
      console.log("[debouncedRefreshSession] Calling refresh after debounce");
      refreshSession();
    }, 300),
    [refreshSession]
  );

  // Sign out function
  const signOut = async (): Promise<void> => {
    console.log("[signOut] Starting sign out process");
    
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('[signOut] Error signing out:', error);
      toast.error('Failed to sign out');
      
      // Force reset state even if signout failed
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
      console.log("[signOut] Sign out completed");
    }
  };

  // Google sign in
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log("[signInWithGoogle] Starting Google sign in");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      console.log("[signInWithGoogle] Sign in initiated, redirecting...");
    } catch (error) {
      console.error('[signInWithGoogle] Error:', error);
      toast.error('Failed to sign in with Google');
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<Profile>): Promise<void> => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (!profile) throw new Error('Profile not available');
      
      // Get auth token for API call
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      console.log("[updateProfile] Updating profile with data:", data);
      
      // Prepare data to send to API
      const updateData = {
        userId: user.id,
        pseudo: data.pseudo !== undefined ? data.pseudo : profile.pseudo || "",
        skin_id: data.default_skin_id !== undefined ? data.default_skin_id : profile.default_skin_id || null
      };
      
      // Call API endpoint for updating profile
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
        console.error('[updateProfile] Error from API:', errorText);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }
      
      // Update local state with new data
      setProfile(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profile updated');
    } catch (error) {
      console.error('[updateProfile] Error:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async (): Promise<void> => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Get auth token for API call
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      // Call API endpoint
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
        console.error('[deleteAccount] Error from API:', errorText);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      // Delete user auth record
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id);
      if (userError) throw userError;
      
      // Sign out to clear local state
      await signOut();
      toast.success('Your account has been successfully deleted');
    } catch (error) {
      console.error('[deleteAccount] Error:', error);
      toast.error('Failed to delete account');
      throw error;
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    if (sessionInitializedRef.current) return;
    
    let isMounted = true;
    console.log("[AuthProvider] Initial mount, initializing auth state");
    sessionInitializedRef.current = true;
    
    const initialize = async () => {
      try {
        setLoading(true);
        console.log("[AuthProvider] Getting initial session");
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          console.log("[AuthProvider] Initial session found with user:", session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("[AuthProvider] No initial session found");
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("[AuthProvider] Initialization error:", error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  // Set up auth state change listener
  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state change listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[onAuthStateChange] Event:", event, "User:", session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("[onAuthStateChange] User signed in:", session.user.id);
          setLoading(true);
          setUser(session.user);
          await fetchProfile(session.user.id);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log("[onAuthStateChange] User signed out");
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("[onAuthStateChange] Token refreshed for user:", session.user.id);
          setUser(session.user);
          // Only fetch profile if needed
          if (!profile) {
            setLoading(true);
            await fetchProfile(session.user.id);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, profile]);

  // Set up a single visibility change listener
  useEffect(() => {
    if (visibilityListenerAttachedRef.current) return;
    visibilityListenerAttachedRef.current = true;
    
    console.log("[AuthProvider] Setting up visibility change listener");
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[visibilitychange] Document became visible, refreshing session");
        debouncedRefreshSession();
      }
    };

    // Add the event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      visibilityListenerAttachedRef.current = false;
      
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [debouncedRefreshSession]);

  // Clear any timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

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
        refreshSession: debouncedRefreshSession, // Use debounced version for external calls
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
