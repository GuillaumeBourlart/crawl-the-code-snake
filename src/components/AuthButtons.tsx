
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn, Loader2, User, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

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
          className="bg-gray-900/70 border-green-500/30 text-white hover:bg-green-900/30 rounded-lg shadow-md"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <User className="mr-1 h-4 w-4 text-green-400" />
          )}
          {user.email?.split('@')[0] || "Profil"}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900/90 border-green-500/30 text-white min-w-[160px] z-50">
        <DropdownMenuItem className="hover:bg-green-900/30 cursor-pointer" asChild>
          <Link to="/profile" className="flex w-full">
            <User className="mr-1 h-4 w-4 text-green-400" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="hover:bg-red-900/30 cursor-pointer"
          onClick={handleSignOut}
        >
          <LogOut className="mr-1 h-4 w-4 text-red-400" />
          Déconnexion
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
