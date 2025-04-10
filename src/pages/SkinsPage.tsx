
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

// Utilisation de la Publishable key fournie
const stripePromise = loadStripe("pk_live_N6Rg1MNzwQz7XW5Y4XfSFxaB00a88aqKEq");

const SkinsPage = () => {
  const { 
    selectedSkin, 
    availableSkins, 
    purchasableSkins, 
    setSelectedSkin, 
    loading: skinsLoading, 
    refresh: refreshSkins,
    fetchError,
    freeSkins
  } = useSkins();
  const { user, profile, supabase, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);

  useEffect(() => {
    if (!hasAttemptedRefresh) {
      console.log("SkinsPage mounted, refreshing skins");
      refreshSkins();
      setHasAttemptedRefresh(true);
    }
  }, [refreshSkins, hasAttemptedRefresh]);

  useEffect(() => {
    if (fetchError) {
      console.error("Fetch error:", fetchError);
      toast.error("Erreur de chargement des données. Veuillez réessayer.");
    }
  }, [fetchError]);

  const handlePurchase = async (skin: GameSkin) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour acheter des skins");
      return;
    }

    try {
      setIsProcessing(true);
      console.log("Démarrage du processus d'achat pour le skin:", skin.id, skin.name);
      
      // Utiliser directement l'URL du endpoint au lieu de la fonction invoke
      const response = await fetch('https://ckvbjbclofykscigudjs.supabase.co/functions/v1/swift-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token)}`
        },
        body: JSON.stringify({ 
          path: "/create-checkout-session",
          skin_id: skin.id,
          user_id: user.id
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de réponse HTTP:", response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Réponse reçue de swift-endpoint/create-checkout-session:", data);
      
      if (!data) {
        console.error("Réponse vide de swift-endpoint");
        throw new Error("Réponse vide du serveur");
      }
      
      if (data?.sessionId) {
        // Redirection vers Stripe Checkout avec le sessionId
        const stripe = await stripePromise;
        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
      } else {
        console.error("Réponse sans sessionId:", data);
        throw new Error("Pas de sessionId retourné");
      }
    } catch (error: any) {
      console.error("Erreur détaillée lors de la création de la session de paiement:", error);
      const errorMessage = error.message || "Erreur inconnue";
      toast.error(`Échec de traitement du paiement: ${errorMessage}`);
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
    setSelectedSkin(selectedSkin.id);
    navigate('/');
    toast.success("Skin confirmé ! Vous pouvez maintenant jouer.");
  };

  const isLoading = authLoading || skinsLoading;

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden">
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

      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <p className="text-lg text-gray-300">Chargement des skins...</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-150px)] pr-4">
            <div className="mb-6 flex justify-center">
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleConfirmSelection}
                disabled={!selectedSkin}
                size="lg"
              >
                Valider
              </Button>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Skins Gratuits</h2>
              
              <div>
                {freeSkins && freeSkins.length > 0 ? (
                  <SkinSelector 
                    onSelectSkin={handleSkinSelectAndSave}
                    showPreview={true}
                    previewPattern="snake"
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Aucun skin gratuit disponible pour le moment</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold mb-3 border-b border-gray-700 pb-2">Boutique</h2>
              </div>
              
              {!user && (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 mb-4 text-sm">
                  <p className="text-center">
                    Connectez-vous avec Google pour acheter et sauvegarder vos skins
                  </p>
                </div>
              )}
              
              <div>
                {purchasableSkins && purchasableSkins.length > 0 ? (
                  <SkinSelector 
                    showPurchasable={true} 
                    onPurchase={handlePurchase}
                    onSelectSkin={handleSkinSelectAndSave}
                    showPreview={true}
                    previewPattern="snake"
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Aucun skin premium disponible pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </main>

      <footer className="py-4 px-6 text-center bg-gray-900/80 text-gray-400 text-sm">
        © 2025 Code Crawl - Tous les skins achetés sont liés à votre compte
      </footer>
    </div>
  );
};

export default SkinsPage;
