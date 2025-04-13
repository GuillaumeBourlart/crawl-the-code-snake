
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn, Loader2, User, Settings, Trash2 } from "lucide-react";
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
          <User className="mr-1 h-4 w-4 text-blue-400" />
          {user.email?.split('@')[0] || "Mon Compte"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900/95 border-gray-700 text-white min-w-[200px] z-50">
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-800">
          <Link to="/profile" className="flex items-center">
            <Settings className="mr-2 h-4 w-4 text-blue-400" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700/50" />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isLoading}
          className="cursor-pointer hover:bg-gray-800 text-red-400"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
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
