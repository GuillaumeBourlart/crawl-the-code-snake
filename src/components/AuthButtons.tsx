
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn, Loader2, UserRound, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AuthButtons = () => {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempt, setLoginAttempt] = useState(0);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Reset loading state if user changes or auth loading state changes
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Retry mechanism for authentication failures
  useEffect(() => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1500;
    
    if (loginAttempt > 0 && loginAttempt <= MAX_RETRIES && !user && !authLoading) {
      const retryTimer = setTimeout(() => {
        toast.info(`Nouvelle tentative de connexion (${loginAttempt}/${MAX_RETRIES})...`);
        handleSignIn(true);
      }, RETRY_DELAY);
      
      return () => clearTimeout(retryTimer);
    }
  }, [loginAttempt, user, authLoading]);

  const handleSignIn = async (isRetry = false) => {
    try {
      setIsLoading(true);
      
      if (!isRetry) {
        setLoginAttempt(1);
      } else {
        setLoginAttempt(prev => prev + 1);
      }
      
      await signInWithGoogle();
      // Loading state will be reset by the useEffect when auth state changes
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
      toast.error("Échec de connexion. Veuillez réessayer.");
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast.success("Vous êtes déconnecté");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Échec de déconnexion. Veuillez réessayer.");
    }
    // Loading state will be reset by the useEffect
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  if (authLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md ${isMobile ? 'scale-75' : ''}`}
        disabled
      >
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md ${isMobile ? 'scale-75' : ''}`}
        >
          <UserRound className="mr-1 h-4 w-4 text-blue-400" />
          {isMobile ? '' : user.email?.split('@')[0]}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-gray-900/95 border-blue-500/30 text-white z-50"
        sideOffset={5}
        align="end"
      >
        <DropdownMenuItem 
          className="hover:bg-blue-900/30 cursor-pointer"
          onClick={goToProfile}
        >
          <UserRound className="mr-2 h-4 w-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="hover:bg-red-900/30 cursor-pointer"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4 text-red-400" />
          )}
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className={`bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md ${isMobile ? 'scale-75' : ''}`}
      onClick={() => handleSignIn(false)}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="mr-1 h-4 w-4 text-blue-400" />
      )}
      {isMobile ? '' : 'Sign In with Google'}
    </Button>
  );
};

export default AuthButtons;
