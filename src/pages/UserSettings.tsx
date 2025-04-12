import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useSkins } from "@/hooks/use-skins";
import HexBackground from "@/components/HexBackground";
import { toast } from "sonner";
import SkinSelector from "@/components/SkinSelector";
import { ScrollArea } from "@/components/ui/scroll-area";
import Footer from "@/components/Footer";

const UserSettings = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { selectedSkin, setSelectedSkin, loading: skinsLoading } = useSkins();
  const [username, setUsername] = useState(profile?.pseudo || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleSave = async () => {
    if (!user || !profile) {
      toast.error("Vous devez être connecté pour modifier vos paramètres");
      return;
    }

    if (!username.trim()) {
      toast.error("Le pseudo ne peut pas être vide");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({ 
        pseudo: username,
        default_skin_id: selectedSkin?.id
      });
      toast.success("Paramètres sauvegardés avec succès");
    } catch (error) {
      console.error("Error saving user settings:", error);
      toast.error("Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !profile) {
    navigate('/');
    return null;
  }

  const isLoading = authLoading || skinsLoading;

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden">
      <HexBackground />
      
      <div className="flex justify-between items-center w-full p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-800/60 hover:bg-gray-700/70"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-xl font-bold text-white">Paramètres du compte</h1>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 overflow-hidden">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mt-4 text-gray-300">Chargement de vos informations...</p>
            </div>
          ) : (
            <>
              <div className="mb-8 bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
                <h2 className="text-lg font-medium text-indigo-400 mb-4">Informations personnelles</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="bg-gray-800/60 border-gray-700 text-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500">Connecté via Google</p>
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                      Pseudo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="Votre pseudo"
                        className="pl-10 bg-gray-800/60 border-gray-700 text-white"
                        maxLength={16}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8 bg-gray-900/70 backdrop-blur-sm rounded-xl border border-gray-800/50 p-6">
                <h2 className="text-lg font-medium text-indigo-400 mb-4">Skin par défaut</h2>
                <p className="text-sm text-gray-300 mb-4">
                  Ce skin sera automatiquement sélectionné au démarrage du jeu.
                </p>
                
                <ScrollArea className="h-[400px] pr-4">
                  <SkinSelector 
                    onSelectSkin={setSelectedSkin}
                    showPreview={true}
                    previewPattern="snake"
                    hideUnavailable={true}
                  />
                </ScrollArea>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserSettings;
