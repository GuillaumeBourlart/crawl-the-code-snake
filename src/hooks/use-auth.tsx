import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase';

const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzc4NjAxNCwiZXhwIjoyMDU5MzYyMDE0fQ.K68E3MUX8mU7cnyoHVBHWvy9oVmeaRttsLjhERyenbQ";
const apiUrl = "https://api.grubz.io"; // Using the new API URL

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  supabase: SupabaseClient;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create Supabase client instance with persistSession: false
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false // Disable session persistence across tabs/refreshes
  }
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);

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
        // If error is not 'no rows returned', it's a real error
        if (error.code !== 'PGRST116') {
          console.error('Database error fetching profile:', error);
          throw error;
        }
        
        // No profile found, create a new one
        console.log("No profile found, creating new profile for user:", userId);
        const newProfile: Profile = {
          id: userId,
          pseudo: `Player_${Math.floor(Math.random() * 10000)}`,
          skins: [], // Initialize with empty skins array
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
          // Fetch the newly created profile to ensure we have the server-generated values
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
        // Profile successfully fetched
        console.log("Profile retrieved:", data);
        setProfile(data as Profile);
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
      
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Échec de déconnexion');
      
      // Force reset the state even if sign out failed
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const getSession = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          console.log("Session found with user:", session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log("No session found");
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Session retrieval error:", error);
        if (isMounted) {
          setLoading(false);
          // If there's an error getting the session, force sign out
          signOut();
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
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      console.log("Attempting to sign in with Google...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Non authentifié');
      
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
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('Non authentifié');
      
      setLoading(true);
      
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
      setLoading(false);
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
        loading,
        updateProfile,
        deleteAccount,
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
