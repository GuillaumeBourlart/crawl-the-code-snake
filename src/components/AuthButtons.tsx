
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn, Loader2, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const AuthButtons = () => {
  const { user, signInWithGoogle, signOut, loading: authLoading, resetAuthState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [stuckLoadingDetected, setStuckLoadingDetected] = useState(false);
  
  // Reset loading state if user changes or auth loading state changes
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
      setStuckLoadingDetected(false);
    }
  }, [user, authLoading]);

  // Detect if loading state is stuck for too long
  useEffect(() => {
    let stuckTimer: number | null = null;
    
    if (authLoading) {
      stuckTimer = window.setTimeout(() => {
        if (authLoading) {
          console.log("Auth loading state appears to be stuck");
          setStuckLoadingDetected(true);
        }
      }, 5000); // Consider loading stuck after 5 seconds
    }
    
    return () => {
      if (stuckTimer !== null) {
        clearTimeout(stuckTimer);
      }
    };
  }, [authLoading]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // No need for timeout as the page will redirect
    } catch (error) {
      setIsLoading(false);
      toast.error("Échec de connexion");
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoading(false);
      toast.error("Échec de déconnexion");
    }
    // Loading state will be reset by the useEffect
  };

  const handleResetAuth = () => {
    toast.info("Réinitialisation de l'état d'authentification...");
    resetAuthState();
    setStuckLoadingDetected(false);
  };

  if (authLoading) {
    return (
      <div className="flex gap-2">
        {stuckLoadingDetected && (
          <Button
            variant="destructive"
            size="sm"
            className="rounded-lg shadow-md"
            onClick={handleResetAuth}
          >
            <RefreshCcw className="mr-1 h-4 w-4" />
            Débloquer
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md"
          disabled
        >
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          Chargement...
        </Button>
      </div>
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
      Se connecter
    </Button>
  );
};

export default AuthButtons;
