import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { eventBus, EVENTS } from '../lib/event-bus';
import loadingState from '../lib/loading-states';

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
  refreshSession: () => Promise<void>;
  supabase: typeof supabase;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      console.error('No user ID provided for profile fetch');
      setLoading(false);
      return;
    }

    // Use the loading state manager to prevent concurrent fetches
    return loadingState.executeOnce(`fetch_profile_${userId}`, async () => {
      const maxAttempts = 10;
      let lastError = null;
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`Attempt ${attempt}/${maxAttempts} to fetch profile for user ${userId}`);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            lastError = error;
            throw error;
          }

          if (data) {
            console.log('Profile fetched successfully:', data);
            
            // Process skins array if present to ensure it's valid
            if (data.skins) {
              try {
                // Handle different formats of skins data
                if (typeof data.skins === 'string') {
                  // If it's a string (JSON), parse it
                  data.skins = JSON.parse(data.skins);
                }
                
                // Ensure it's an array of numbers
                if (Array.isArray(data.skins)) {
                  data.skins = data.skins
                    .filter(id => id !== null && id !== undefined)
                    .map(id => typeof id === 'number' ? id : Number(id))
                    .filter(id => !isNaN(id));
                } else {
                  // If it's not an array, initialize as empty array
                  console.warn('Profile skins is not an array, resetting to empty array');
                  data.skins = [];
                }
              } catch (error) {
                console.error('Error processing profile skins array:', error);
                data.skins = [];
              }
            } else {
              data.skins = [];
            }
            
            setProfile(data);
            setProfileFetchAttempted(true);
            setLoading(false);
            
            // Emit event to notify other components that profile is loaded
            eventBus.emit(EVENTS.AUTH_PROFILE_LOADED, { profile: data });
            
            return data;
          }
          
          // No data found but no error, wait and retry
          const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`No profile found, attempt ${attempt}/${maxAttempts}, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } catch (error) {
          console.error(`Error in profile fetch attempt ${attempt}:`, error);
          lastError = error;
          
          if (attempt < maxAttempts) {
            const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      // If we get here, all attempts failed
      console.error('Failed to fetch profile after max attempts');
      setProfileFetchAttempted(true);
      setLoading(false);
      toast.error('Erreur lors de la récupération du profil');
      
      // Emit error event
      eventBus.emit(EVENTS.AUTH_ERROR, { 
        type: 'profile_fetch_failed', 
        error: lastError 
      });
      
      return null;
    });
  }, []);

  const refreshSession = useCallback(async () => {
    return loadingState.executeOnce('refresh_session', async () => {
      try {
        console.log('Refreshing auth session');
        
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
          console.log('Session refreshed successfully', { userId: session.user.id });
          
          // Only update user if it changed
          if (!user || user.id !== session.user.id) {
            setUser(session.user);
            eventBus.emit(EVENTS.AUTH_SESSION_REFRESHED, { user: session.user });
          }
          
          // Fetch profile if needed
          if (!profile && !profileFetchAttempted) {
            await fetchProfile(session.user.id);
          }
          
          return session;
        } else {
          console.log('No active session found during refresh');
          if (user) {
            // We have a user in state but no session - sign out
            await signOut();
          }
          return null;
        }
      } catch (error) {
        console.error('Error refreshing session:', error);
        eventBus.emit(EVENTS.AUTH_ERROR, { 
          type: 'session_refresh_failed', 
          error 
        });
        
        // If we can't refresh the session, sign out
        if (user) {
          await signOut();
        }
        return null;
      }
    });
  }, [user, profile, profileFetchAttempted, fetchProfile]);

  const signOut = useCallback(async () => {
    return loadingState.executeOnce('sign_out', async () => {
      try {
        setLoading(true);
        console.log("Signing out user");
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Clear user data
        setUser(null);
        setProfile(null);
        setProfileFetchAttempted(false);
        
        // Emit event for other components
        eventBus.emit(EVENTS.AUTH_SIGNED_OUT);
        
        console.log("Successfully signed out");
        return true;
      } catch (error) {
        console.error('Error signing out:', error);
        toast.error('Erreur lors de la déconnexion');
        
        eventBus.emit(EVENTS.AUTH_ERROR, {
          type: 'sign_out_failed',
          error
        });
        
        return false;
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const getInitialSession = async () => {
      return loadingState.executeOnce('initial_session_fetch', async () => {
        try {
          console.log('Fetching initial auth session');
          
          const { data: { session }, error } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Initial session fetch timeout')), 10000)
            )
          ]);

          if (!isMounted) return null;

          if (error) {
            throw error;
          }

          if (session?.user) {
            console.log('Initial session found for user', session.user.id);
            setUser(session.user);
            eventBus.emit(EVENTS.AUTH_SESSION_REFRESHED, { user: session.user });
            
            if (!profile && !profileFetchAttempted) {
              await fetchProfile(session.user.id);
            } else {
              setLoading(false);
            }
            
            return session;
          } else {
            console.log('No initial session found');
            setLoading(false);
            return null;
          }
        } catch (error) {
          console.error('Error getting initial session:', error);
          eventBus.emit(EVENTS.AUTH_ERROR, { 
            type: 'initial_session_fetch_failed', 
            error 
          });
          
          if (isMounted) {
            // If there's an error getting the session, force sign out
            setUser(null);
            setProfile(null);
            setProfileFetchAttempted(false);
            setLoading(false);
          }
          
          return null;
        }
      });
    };

    // Start fetching the session right away
    getInitialSession();
    
    // Setup visibility manager from the event bus
    const visibilitySubscription = eventBus.subscribe(EVENTS.DOCUMENT_BECAME_VISIBLE, async () => {
      if (!isMounted) return;
      
      console.log('Document became visible, checking session state');
      try {
        // If we already have a user but no profile, fetch the profile
        if (user && !profile) {
          console.log('No profile loaded, fetching profile for user', user.id);
          await fetchProfile(user.id);
          return;
        }
        
        // Otherwise refresh the session
        await refreshSession();
      } catch (error) {
        console.error('Error handling visibility change:', error);
      }
    });
    
    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (!isMounted) return;
        
        // Emit event for all auth state changes
        eventBus.emit(EVENTS.AUTH_STATE_CHANGED, { event, session });
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log("User signed in:", session.user.id);
          setUser(session.user);
          setProfileFetchAttempted(false); // Reset to allow fetch on new sign in
          
          // Emit specific event
          eventBus.emit(EVENTS.AUTH_SIGNED_IN, { user: session.user });
          
          // Fetch user profile
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
          setLoading(false);
          
          // Emit specific event
          eventBus.emit(EVENTS.AUTH_SIGNED_OUT);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log("Token refreshed for user:", session.user.id);
          setUser(session.user);
          
          // Emit specific event
          eventBus.emit(EVENTS.AUTH_SESSION_REFRESHED, { user: session.user });
          
          if (!profile) {
            await fetchProfile(session.user.id);
          } else {
            setLoading(false);
          }
        }
      }
    );
    
    // Initialize visibility manager
    const visibilityManager = eventBus.setupVisibilityListener();
    
    // Setup periodic session check (every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && user) {
        refreshSession();
      }
    }, 300000);

    return () => {
      isMounted = false;
      
      // Clean up all subscriptions
      subscription.unsubscribe();
      visibilitySubscription.unsubscribe();
      visibilityManager.unsubscribe();
      
      clearInterval(sessionCheckInterval);
    };
  }, [fetchProfile, refreshSession, user, profile]);

  const signInWithGoogle = useCallback(async () => {
    return loadingState.executeOnce('sign_in_google', async () => {
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
          eventBus.emit(EVENTS.AUTH_ERROR, { 
            type: 'google_sign_in_failed', 
            error 
          });
          throw error;
        }
        
        console.log("SignInWithGoogle response:", data);
        // Loading will be handled by auth state change
        
        // Store the current path in sessionStorage for redirect after auth
        sessionStorage.setItem('auth_redirect_path', currentPath);
        
        return data;
      } catch (error) {
        console.error('Error signing in with Google:', error);
        toast.error('Échec de connexion avec Google');
        setLoading(false);
        return null;
      }
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        refreshSession,
        supabase,
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