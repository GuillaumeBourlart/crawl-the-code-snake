
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSkins } from "@/hooks/use-skins";
import { useAuth } from "@/hooks/use-auth";
import SkinSelector from "@/components/SkinSelector";
import { GameSkin } from "@/types/supabase";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthButtons from "@/components/AuthButtons";
import { toast } from "sonner";

const stripePromise = loadStripe("pk_test_your_stripe_key");

const SkinsPage = () => {
  const { 
    selectedSkin, 
    availableSkins, 
    purchasableSkins, 
    setSelectedSkin, 
    loading: skinsLoading, 
    refresh: refreshSkins,
    fetchError
  } = useSkins();
  const { user, profile, supabase, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);

  // Force refresh skins when the page loads once
  useEffect(() => {
    if (!hasAttemptedRefresh) {
      console.log("SkinsPage mounted, refreshing skins");
      refreshSkins();
      setHasAttemptedRefresh(true);
    }
  }, [refreshSkins, hasAttemptedRefresh]);

  // Handle fetch errors by signing out
  useEffect(() => {
    if (fetchError && user) {
      console.error("Critical fetch error, signing out:", fetchError);
      toast.error("Erreur de chargement des données. Déconnexion en cours...");
      signOut();
    }
  }, [fetchError, user, signOut]);

  const handlePurchase = async (skin: GameSkin) => {
    if (!user) {
      toast.error("Please sign in to purchase skins");
      return;
    }

    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          skinId: skin.id,
          priceAmount: skin.price,
          skinName: skin.name
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkinSelectAndSave = (skinId: number) => {
    console.log("Selecting skin in SkinsPage:", skinId);
    setSelectedSkin(skinId);
    toast.success("Skin sélectionné !");
  };

  const handleConfirmSelection = () => {
    if (!selectedSkin) {
      toast.error("Veuillez sélectionner un skin avant de continuer");
      return;
    }
    
    console.log("Confirming skin selection:", selectedSkin.id);
    // Make sure the skin is saved one last time before navigating
    setSelectedSkin(selectedSkin.id);
    navigate('/');
    toast.success("Skin confirmé ! Vous pouvez maintenant jouer.");
  };

  const isLoading = authLoading || skinsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 text-white">
      <header className="px-4 py-4 flex items-center justify-between bg-gray-900/80 backdrop-blur-sm shadow-md">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mr-4 text-gray-200 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Retour
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">
            Code Crawl Skins
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {user && profile && (
            <div className="text-sm text-gray-300 mr-2">
              {profile.pseudo}
            </div>
          )}
          <AuthButtons />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <p className="text-lg text-gray-300">Chargement des skins...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleConfirmSelection}
                disabled={!selectedSkin}
              >
                Valider
              </Button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Vos skins</h2>
              <p className="text-sm text-gray-300 mb-4">
                Sélectionnez parmi vos skins disponibles
              </p>
              
              <div className="rounded-xl p-6 border border-gray-800 shadow-xl">
                <SkinSelector 
                  onSelectSkin={handleSkinSelectAndSave}
                  showPreview={true}
                  previewPattern="snake"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">Boutique</h2>
                <div className="flex items-center text-sm text-gray-300">
                  <ShoppingCart className="h-4 w-4 mr-1 text-indigo-400" />
                  Obtenir plus de skins
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Achetez des skins premium pour vous démarquer dans le jeu
              </p>
              
              {!user && (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 mb-4 text-sm">
                  <p className="text-center">
                    Connectez-vous avec Google pour acheter et sauvegarder vos skins
                  </p>
                </div>
              )}
              
              <div className="rounded-xl p-6 border border-gray-800 shadow-xl">
                <SkinSelector 
                  showPurchasable={true} 
                  onPurchase={handlePurchase}
                  onSelectSkin={handleSkinSelectAndSave}
                  showPreview={true}
                  previewPattern="snake"
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="py-4 px-6 text-center bg-gray-900/80 text-gray-400 text-sm">
        © 2025 Code Crawl - Tous les skins achetés sont liés à votre compte
      </footer>
    </div>
  );
};

export default SkinsPage;
