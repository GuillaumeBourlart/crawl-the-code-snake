
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const AuthButtons = () => {
  const { 
    user, 
    signInWithGoogle, 
    signOut, 
    loading: authLoading, 
    refreshSession, 
    sessionError,
    resetAuthState,
    authInitialized
  } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  
  // Reset loading state if user changes or auth loading state changes
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Reset loading state and refresh session on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab visible in AuthButtons, ensuring fresh state");
        setIsLoading(false);
        // Refreshing is now handled in use-auth.tsx more comprehensively
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshSession]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // No need for timeout as the page will redirect
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
    // Loading state will be reset by the useEffect
  };

  const handleForceReset = async () => {
    setIsResetLoading(true);
    try {
      await resetAuthState();
      toast.success("État d'authentification réinitialisé");
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Échec de la réinitialisation");
    } finally {
      setIsResetLoading(false);
    }
  };

  // Show loading spinner while auth is initializing
  if (!authInitialized) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md"
        disabled
      >
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        Chargement...
      </Button>
    );
  }

  // Show normal loading state while operations are in progress
  if (authLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md"
        disabled
      >
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        Chargement...
      </Button>
    );
  }

  // Show error state with reset button if we have a session error
  if (sessionError) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-gray-900/70 border-red-500/30 text-white hover:bg-red-900/30 rounded-lg shadow-md"
        onClick={handleForceReset}
        disabled={isResetLoading}
      >
        {isResetLoading ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-1 h-4 w-4 text-red-400" />
        )}
        Réinitialiser
      </Button>
    );
  }

  return user ? (
    <Button
      variant="outline"
      size="sm"
      className="bg-gray-900/70 border-red-500/30 text-white hover:bg-red-900/30 rounded-lg shadow-md"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-1 h-4 w-4 text-red-400" />
      )}
      Déconnexion
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className="bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md"
      onClick={handleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="mr-1 h-4 w-4 text-blue-400" />
      )}
      Connexion Google
    </Button>
  );
};

export default AuthButtons;
