import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';

type Profile = {
  id: string;
  username: string;
  avatarUrl?: string;
  // Add other profile fields as needed
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);

  const fetchProfile = async (userId: string, retryCount = 0) => {
    console.log("Fetching profile for user:", userId);
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    try {
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        )
      ]);

      if (error) {
        throw error;
      }

      if (data) {
        console.log("Profile fetched successfully:", data);
        setProfile(data);
        setProfileFetchAttempted(true);
        setLoading(false);
      } else if (retryCount < maxRetries) {
        console.log(`Profile fetch attempt ${retryCount + 1} failed, retrying...`);
        setTimeout(() => fetchProfile(userId, retryCount + 1), retryDelay);
      } else {
        console.error("Failed to fetch profile after max retries");
        setProfileFetchAttempted(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (retryCount < maxRetries) {
        setTimeout(() => fetchProfile(userId, retryCount + 1), retryDelay);
      } else {
        setProfileFetchAttempted(true);
        setLoading(false);
        toast.error('Erreur lors de la récupération du profil');
      }
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session refresh timeout')), 5000)
        )
      ]);

      if (error) {
        throw error;
      }

      if (session?.user) {
        setUser(session.user);
        if (!profile && !profileFetchAttempted) {
          await fetchProfile(session.user.id);
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      // If we can't refresh the session, sign out
      signOut();
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user data
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
      
      console.log("Successfully signed out");
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Initial session fetch timeout')), 10000)
          )
        ]);

        if (!isMounted) return;

        if (error) {
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
          if (!profile && !profileFetchAttempted) {
            await fetchProfile(session.user.id);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
