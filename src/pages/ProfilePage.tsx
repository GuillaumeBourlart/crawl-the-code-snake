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
import SkinPreview from "@/components/SkinPreview";
import { useLanguage } from "@/contexts/LanguageContext";
const { t } = useLanguage();

const ProfilePage = () => {
  const { user, profile, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { 
    selectedSkinId, 
    selectedSkin, 
    getDebugInfo, 
    setSelectedSkin 
  } = useSkins();
  
  const [pseudo, setPseudo] = useState("");
  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [isChangingSkin, setIsChangingSkin] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (profile?.pseudo) {
      setPseudo(profile.pseudo);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) {
      console.log("[ProfilePage] Aucun utilisateur connecté, redirection vers '/'.");
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (getDebugInfo) {
      setDebugInfo(getDebugInfo());
    }
  }, [getDebugInfo, selectedSkinId, user, profile]);

  const handleUpdatePseudo = async () => {
    if (!pseudo.trim()) {
      toast.error("Le pseudo ne peut pas être vide");
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        pseudo: pseudo.trim()
      });

      setIsEditingPseudo(false);
      toast.success("Pseudo mis à jour avec succès");
    } catch (error) {
      console.error("Error updating pseudo:", error);
      toast.error("Erreur lors de la mise à jour du pseudo");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDefaultSkin = async (skinId: number) => {
    console.log("ProfilePage - handleUpdateDefaultSkin called with skinId:", skinId);
    
    try {
      setLoading(true);
      await updateProfile({
        default_skin_id: skinId
      });
      
      setSelectedSkin(skinId);
      
      setIsChangingSkin(false);
      toast.success("Skin par défaut mis à jour avec succès");
    } catch (error) {
      console.error("Error updating default skin:", error);
      toast.error("Erreur lors de la mise à jour du skin par défaut");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
    } catch (error) {
      console.error("Error deleting account:", error);
      setIsDeleting(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };

  const navigateToSkins = () => {
    navigate('/skins');
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto">
      <header className="sticky top-0 w-full py-4 px-6 flex justify-between items-center z-10 bg-gray-900/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800/30"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>
        <AuthButtons />
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 mb-16">
        <div className="bg-gray-900/70 border border-blue-500/30 rounded-lg p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Profil Utilisateur</h1>
          
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
            
            <div 
              onClick={navigateToSkins}
              className="mt-4 flex justify-center cursor-pointer transition-transform hover:scale-105 bg-gray-900/50 p-4 rounded-lg border border-gray-700"
            >
              {selectedSkin ? (
                <div className="flex flex-col items-center">
                  <SkinPreview 
                    skin={selectedSkin} 
                    pattern="snake" 
                    size="medium" 
                    animate={true} 
                  />
                  <p className="mt-3 text-sm text-indigo-300">
                    Cliquez pour changer votre skin
                  </p>
                </div>
              ) : (
                <div className="h-48 w-48 flex items-center justify-center">
                  <p className="text-gray-400">Chargement du skin...</p>
                </div>
              )}
            </div>
          </div>
          
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

      <div className="mt-auto">
        <Footer />
      </div>

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
