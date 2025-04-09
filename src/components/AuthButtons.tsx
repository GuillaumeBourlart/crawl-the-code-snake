
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LogIn } from "lucide-react";

const AuthButtons = () => {
  const { user, signInWithGoogle, signOut } = useAuth();

  return user ? (
    <Button
      variant="outline"
      size="sm"
      className="bg-gray-900/70 border-red-500/30 text-white hover:bg-red-900/30 rounded-lg shadow-md"
      onClick={signOut}
    >
      <LogOut className="mr-1 h-4 w-4 text-red-400" />
      Sign Out
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className="bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md"
      onClick={signInWithGoogle}
    >
      <LogIn className="mr-1 h-4 w-4 text-blue-400" />
      Sign In with Google
    </Button>
  );
};

export default AuthButtons;
