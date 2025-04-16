
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isRefreshingRef = useRef(false);
  
  // Fetch profile function - attempts multiple times to handle race conditions
  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      console.log("[fetchProfile] No userId provided.");
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 10;
    let profileData = null;
    
    while (attempts < maxAttempts) {
      console.log(`[fetchProfile] Attempt ${attempts + 1}/${maxAttempts} to get profile for ${userId}.`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error("[fetchProfile] Error fetching profile (attempt):", error);
          break;
        }
      } else if (data) {
        profileData = data;
        console.log("[fetchProfile] Profile retrieved:", data);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (profileData) {
      setProfile(profileData as Profile);
    } else {
      console.error("[fetchProfile] Failed after maximum attempts to retrieve profile.");
      toast.error('Failed to retrieve your profile after multiple attempts.');
    }
    
    return profileData;
  }, []);

  // Debounce function to prevent multiple rapid calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Session refresh function with locking mechanism
  const refreshSession = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log("[refreshSession] A refresh is already in progress, cancelling this call.");
      return;
    }
    
    isRefreshingRef.current = true;
    console.log("[refreshSession] Starting session refresh.");
    
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[refreshSession] Session retrieved:", session);

      if (session?.user) {
        console.log("[refreshSession] Authenticated user:", session.user.id);
        setUser(session.user);
        
        // Always fetch profile on refresh
        console.log("[refreshSession] Calling fetchProfile for user:", session.user.id);
        await fetchProfile(session.user.id);
      } else {
        console.log("[refreshSession] No session found.");
        setUser(null);
        setProfile(null);
      }
    } catch (error: any) {
      console.error("[refreshSession] Error while refreshing session:", error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
      isRefreshingRef.current = false; // Release the lock
      console.log("[refreshSession] Refresh complete, lock released.");
    }
  }, [fetchProfile]);

  // Create the debounced version of refreshSession
  const debouncedRefreshSession = useMemo(() => 
    debounce(refreshSession, 500), 
  [refreshSession]);

  // Sign out function
  const signOut = async () => {
    try {
      console.log("[signOut] Signing out user.");
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user data
      setUser(null);
      setProfile(null);
      
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('[signOut] Error signing out:', error);
      toast.error('Failed to sign out');
      
      // Force reset the state even if sign out failed
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    let isMounted = true;
    console.log("[AuthProvider] Auth provider mounted, initializing...");
    setLoading(true);
    
    const initialize = async () => {
      try {
        console.log("[AuthProvider] Getting initial session.");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          console.log("[AuthProvider] Initial session found with user:", session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("[AuthProvider] No initial session found");
          setUser(null);
        }
      } catch (error) {
        console.error("[AuthProvider] Session retrieval error:", error);
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

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[onAuthStateChange] Event:", event, "Session:", session?.user?.id);
        
        if (!isMounted) return;
        
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
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("[onAuthStateChange] Token refreshed for user:", session.user.id);
          setUser(session.user);
          if (!profile) {
            setLoading(true);
            await fetchProfile(session.user.id);
            setLoading(false);
          }
        }
      }
    );

    // Set up a single visibility change listener in AuthProvider
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("[visibilitychange] Tab visible, calling debounced refreshSession");
        debouncedRefreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, debouncedRefreshSession]);

  // Google sign in
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log("[signInWithGoogle] Attempting to sign in with Google...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("[signInWithGoogle] Google sign-in error:", error);
        throw error;
      }
      
      console.log("[signInWithGoogle] Response:", data);
      // Loading will be handled by auth state change
    } catch (error) {
      console.error('[signInWithGoogle] Error signing in with Google:', error);
      toast.error('Failed to sign in with Google');
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (!profile) throw new Error('Profile not available');
      
      // Get auth token for the API call
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      console.log("[updateProfile] Updating profile with data:", data);
      
      // Prepare data to send to the API
      const updateData = {
        userId: user.id,
        pseudo: data.pseudo !== undefined ? data.pseudo : profile.pseudo || "",
        skin_id: data.default_skin_id !== undefined ? data.default_skin_id : profile.default_skin_id || null
      };
      
      console.log("[updateProfile] Sending to API:", updateData);
      
      // Call the API endpoint for updating profile
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
      console.error('[updateProfile] Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('Not authenticated');
      
      // Get auth token for the API call
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      // Call the API endpoint that will trigger deleteUserAccount
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
      
      // Then delete the user auth record
      const { error: userError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (userError) throw userError;
      
      // Sign out to clear local state
      await signOut();
      
      toast.success('Your account has been successfully deleted');
    } catch (error) {
      console.error('[deleteAccount] Error deleting account:', error);
      toast.error('Failed to delete account');
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
