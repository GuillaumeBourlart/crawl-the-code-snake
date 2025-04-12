
import { useState, useRef, useEffect } from "react";
import { 
  User, 
  LogOut, 
  Trash2,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ProfileDropdown = () => {
  const { user, profile, signOut, supabase, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
    setIsLoading(false);
    setIsOpen(false);
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // Delete user profile first
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', user.id);
          
        if (profileError) throw profileError;
        
        // Delete the user auth record
        const { error: userError } = await supabase.auth.admin.deleteUser(user.id);
        if (userError) throw userError;
      }
      
      // Sign out after deletion
      await signOut();
      toast.success("Votre compte a été supprimé avec succès");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Échec de la suppression du compte");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  if (loading) {
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

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center rounded-full bg-gray-900/70 border border-blue-500/30 p-1 hover:bg-blue-900/30 shadow-md transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-indigo-600 text-white">
              {profile?.pseudo ? profile.pseudo.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-900/95 border border-blue-500/30 backdrop-blur-sm z-50">
            <div className="py-2 px-4 border-b border-blue-500/30">
              <p className="text-sm font-medium text-white truncate">{profile?.pseudo || "User"}</p>
              <p className="text-xs text-gray-300 truncate">{user?.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-900/30 flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4 text-red-400" />
                )}
                Se déconnecter
              </button>
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                disabled={isLoading}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-900/30 flex items-center"
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-400" />
                Supprimer le compte
              </button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="bg-gray-900 border-blue-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Supprimer votre compte?</DialogTitle>
            <DialogDescription className="text-gray-300">
              La suppression de votre compte entraînera la perte définitive de toutes vos données, y compris les skins achetés. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirmation(false)}
              className="border-blue-500/30 text-white"
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileDropdown;
