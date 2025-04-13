
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import AuthButtons from "@/components/AuthButtons";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Trash2, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import SkinSelector from "@/components/SkinSelector";
import { useSkins } from "@/hooks/use-skins";

const ProfilePage = () => {
  const { user, profile, loading, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { selectedSkinId } = useSkins();
  
  const [pseudo, setPseudo] = useState("");
  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [isChangingSkin, setIsChangingSkin] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set initial pseudo from profile when loaded
  useEffect(() => {
    if (profile?.pseudo) {
      setPseudo(profile.pseudo);
    }
  }, [profile]);

  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleUpdatePseudo = async () => {
    if (!pseudo.trim()) {
      toast.error("Le pseudo ne peut pas être vide");
      return;
    }

    try {
      await updateProfile({ pseudo: pseudo.trim() });
      setIsEditingPseudo(false);
      toast.success("Pseudo mis à jour avec succès");
    } catch (error) {
      console.error("Error updating pseudo:", error);
      toast.error("Erreur lors de la mise à jour du pseudo");
    }
  };

  const handleUpdateDefaultSkin = async (skinId: number) => {
    try {
      await updateProfile({ default_skin_id: skinId });
      setIsChangingSkin(false);
      toast.success("Skin par défaut mis à jour avec succès");
    } catch (error) {
      console.error("Error updating default skin:", error);
      toast.error("Erreur lors de la mise à jour du skin par défaut");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      // Navigation to home will be handled in the deleteAccount function via signOut
    } catch (error) {
      console.error("Error deleting account:", error);
      setIsDeleting(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full py-4 px-6 flex justify-between items-center z-10">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800/30"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <AuthButtons />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-gray-900/70 border border-blue-500/30 rounded-lg p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Profil Utilisateur</h1>
          
          {/* Pseudo Section */}
          <div className="mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-400" />
                Pseudo
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingPseudo(true)}
                className="bg-gray-700/50 hover:bg-blue-900/30 text-white"
              >
                Modifier
              </Button>
            </div>
            <p className="text-gray-300">{profile?.pseudo || "Non défini"}</p>
          </div>
          
          {/* Default Skin Section */}
          <div className="mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white flex items-center">
                <Palette className="mr-2 h-5 w-5 text-blue-400" />
                Skin par défaut
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsChangingSkin(true)}
                className="bg-gray-700/50 hover:bg-blue-900/30 text-white"
              >
                Changer
              </Button>
            </div>
            <p className="text-gray-300">
              {selectedSkinId ? `Skin #${selectedSkinId}` : "Skin par défaut"}
            </p>
          </div>
          
          {/* Delete Account Section */}
          <div className="p-4 bg-gray-800/50 rounded-lg border border-red-900/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white flex items-center">
                <Trash2 className="mr-2 h-5 w-5 text-red-400" />
                Supprimer le compte
              </h2>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="bg-red-900/70 hover:bg-red-800"
              >
                Supprimer
              </Button>
            </div>
            <p className="text-gray-300">
              Supprimer définitivement votre compte et toutes vos données associées.
            </p>
          </div>
        </div>
      </main>

      <Footer />

      {/* Edit Pseudo Dialog */}
      <Dialog open={isEditingPseudo} onOpenChange={setIsEditingPseudo}>
        <DialogContent className="bg-gray-900 border-blue-500/30 text-white">
          <DialogHeader>
            <DialogTitle>Modifier votre pseudo</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choisissez un nouveau pseudo qui sera affiché dans le jeu et les classements.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Entrez votre nouveau pseudo"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditingPseudo(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Annuler
            </Button>
            <Button onClick={handleUpdatePseudo}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Skin Dialog */}
      <Dialog open={isChangingSkin} onOpenChange={setIsChangingSkin}>
        <DialogContent className="bg-gray-900 border-blue-500/30 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choisir votre skin par défaut</DialogTitle>
            <DialogDescription className="text-gray-400">
              Sélectionnez le skin que vous souhaitez utiliser par défaut en jeu.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <SkinSelector 
              onSelectSkin={(skinId) => handleUpdateDefaultSkin(skinId)}
              simpleMode={true}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsChangingSkin(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Initial Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border-red-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Supprimer votre compte</DialogTitle>
            <DialogDescription className="text-gray-300">
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300 mb-2">
              En supprimant votre compte, vous perdrez définitivement :
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Tous vos skins achetés</li>
              <li>Votre historique de jeu</li>
              <li>Votre place dans les classements</li>
              <li>Toutes vos données personnelles</li>
            </ul>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setIsConfirmDeleteDialogOpen(true);
              }}
              className="bg-red-800 hover:bg-red-700"
            >
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Delete Account Dialog */}
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-red-500/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Confirmation finale</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Cette action est <span className="font-bold">DÉFINITIVE</span> et 
              <span className="font-bold"> IRRÉVERSIBLE</span>. Êtes-vous vraiment sûr de vouloir supprimer votre compte ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-red-800 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePage;
