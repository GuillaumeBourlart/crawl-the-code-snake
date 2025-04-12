
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Settings, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

const UserProfileMenu = () => {
  const { user, profile, signOut, supabase } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      
      // First get current session
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        throw new Error("Session non trouvée");
      }
      
      // Send delete confirmation email
      const { error: deleteError } = await supabase.functions.invoke('delete-account-request', {
        body: { user_id: user.id, email: user.email },
      });
      
      if (deleteError) throw deleteError;
      
      toast.success("Un email de confirmation a été envoyé à votre adresse. Veuillez suivre les instructions pour confirmer la suppression.");
      setIsDeleteDialogOpen(false);
      
    } catch (error: any) {
      console.error("Error initiating account deletion:", error);
      toast.error(`Erreur lors de la demande de suppression: ${error.message || error}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user || !profile) return null;

  const userInitial = profile.pseudo ? profile.pseudo.charAt(0).toUpperCase() : "U";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full bg-gray-800/60 hover:bg-gray-700/70 focus:ring-0">
            <Avatar className="h-8 w-8 border border-gray-700">
              <AvatarFallback className="bg-indigo-900 text-white">
                {userInitial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-gray-900/95 backdrop-blur-sm border border-gray-800 z-50">
          <DropdownMenuLabel className="text-gray-300">
            <span className="block text-sm font-medium text-white">{profile.pseudo}</span>
            <span className="block text-xs text-gray-400 truncate">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-700/50" />
          <DropdownMenuItem className="text-gray-300 hover:text-white cursor-pointer">
            <Link to="/settings" className="flex items-center w-full">
              <Settings className="mr-2 h-4 w-4 text-indigo-400" />
              <span>Paramètres</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-red-400 hover:text-red-300 cursor-pointer" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Supprimer le compte</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700/50" />
          <DropdownMenuItem 
            className="text-gray-300 hover:text-white cursor-pointer" 
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4 text-gray-400" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border border-red-900/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Supprimer votre compte ?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Cette action est <span className="font-bold text-red-400">irréversible</span>. Elle entraînera la perte définitive de :
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Toutes vos données personnelles</li>
                <li>Tous vos skins achetés</li>
                <li>Votre historique de jeu</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Envoi en cours..." : "Confirmer la suppression"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserProfileMenu;
