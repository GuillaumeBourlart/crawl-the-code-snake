import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn, UserRound, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AuthButtons = () => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSignIn = async () => {
    setIsProcessing(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    setIsProcessing(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const goToProfile = () => {
    navigate('/profile');
  };

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
          {t('profile')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="hover:bg-red-900/30 cursor-pointer"
          onClick={handleSignOut}
          disabled={isProcessing}
        >
          {isProcessing ? (
            ""
          ) : (
            <LogOut className="mr-2 h-4 w-4 text-red-400" />
          )}
          {t('sign_out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className={`bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md ${isMobile ? 'scale-75' : ''}`}
      onClick={handleSignIn}
      disabled={isProcessing}
    >
      <LogIn className="mr-1 h-4 w-4 text-blue-400" />
      {isMobile ? '' : t('sign_in')}
    </Button>
  );
};

export default AuthButtons;
