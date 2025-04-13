
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn, Loader2, User, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AuthButtons = () => {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset loading state if user changes or auth loading state changes
  useEffect(() => {
    if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

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

  if (authLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md"
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
          className="bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md"
        >
          {user.email ? user.email.split('@')[0] : 'User'}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900/95 border-gray-700 text-white" align="end">
        <DropdownMenuItem className="hover:bg-blue-900/30 cursor-pointer" asChild>
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem 
          className="hover:bg-red-900/30 cursor-pointer text-red-400" 
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Déconnexion...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
      Sign In with Google
    </Button>
  );
};

export default AuthButtons;
