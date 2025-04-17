
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSkins } from "@/hooks/use-skins";
import { useAuth } from "@/hooks/use-auth";
import SkinSelector from "@/components/SkinSelector";
import { GameSkin } from "@/types/supabase";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthButtons from "@/components/AuthButtons";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const stripePromise = loadStripe("pk_live_N6Rg1MNzwQz7XW5Y4XfSFxaB00a88aqKEq");

const SkinsPage = () => {
  const { 
    selectedSkin, 
    setSelectedSkin, 
    loading: skinsLoading, 
    refresh: refreshSkins,
    fetchError,
    ownedSkinIds
  } = useSkins();
  const { user, profile, supabase, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const isMobile = useIsMobile();
  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);

  console.log("SkinsPage - Render state:", {
    user: !!user,
    profile: !!profile,
    skinsLoading,
    authLoading,
    fetchError: fetchError ? fetchError.message : null,
    selectedSkin: selectedSkin?.id,
    ownedSkins: ownedSkinIds
  });

  useEffect(() => {
    if (!hasAttemptedRefresh) {
      console.log("SkinsPage mounted, refreshing skins");
      refreshSkins();
      setHasAttemptedRefresh(true);
    }
  }, [refreshSkins, hasAttemptedRefresh]);

  useEffect(() => {
    if (fetchError) {
      console.error("Fetch error details:", {
        message: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack
      });
      toast.error("Erreur de chargement des données. Veuillez réessayer.");
    }
  }, [fetchError]);



  const handlePurchase = async (skin: GameSkin) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour acheter des skins");
      console.error("Tentative d'achat sans authentification");
      return;
    }

    try {
      setIsProcessing(true);
      console.log("⭐ Démarrage du processus d'achat pour le skin:", skin.id, skin.name);
      console.log("Skin details:", JSON.stringify(skin));
      
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        console.error("❌ Token d'authentification non disponible");
        throw new Error("Token d'authentification non disponible");
      }
      
      console.log("✅ Token récupéré, appel de l'endpoint create-checkout-session-ts");
      const response = await fetch('https://ckvbjbclofykscigudjs.supabase.co/functions/v1/create-checkout-session-ts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          skin_id: skin.id,
          user_id: user.id
        })
      });
      
      console.log("Réponse de l'API - Status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur de réponse HTTP:", response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Réponse reçue de create-checkout-session-ts:", data);
      
      if (!data) {
        console.error("❌ Réponse vide du serveur");
        throw new Error("Réponse vide du serveur");
      }
      
      if (data?.url) {
        console.log("✅ URL de redirection reçue:", data.url);
        window.location.href = data.url;
      } else if (data?.sessionId) {
        console.log("✅ Session ID reçu, redirection via Stripe SDK:", data.sessionId);
        const stripe = await stripePromise;
        const result = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        
        if (result.error) {
          console.error("❌ Erreur de redirection Stripe:", result.error);
          throw new Error(result.error.message);
        }
      } else {
        console.error("❌ Réponse sans URL ni sessionId:", data);
        throw new Error("Format de réponse invalide");
      }
    } catch (error: any) {
      console.error("❌ Erreur détaillée lors de la création de la session de paiement:", error);
      const errorMessage = error.message || "Erreur inconnue";
      toast.error(`Échec de traitement du paiement: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkinSelectAndSave = async (skinId: number) => {
    console.log("SkinsPage - handleSkinSelectAndSave called with skinId:", skinId);
    
    // Set skin in local state first for immediate UI update
    setSelectedSkin(skinId);
    
    // If user is logged in, also update profile in database
    if (user && profile) {
      console.log("User is logged in, updating skin in database");
      try {
        // Update profile in database using the API
        await updateProfile({
          default_skin_id: skinId
        });
        console.log("Skin updated in database successfully");
      } catch (error) {
        console.error("Error updating skin in database:", error);
        // Toast already shown in setSelectedSkin function
      }
    } else {
      console.log("User not logged in, skin only updated locally");
    }
    
    toast.success("Skin sélectionné !");
  };

  const handleConfirmSelection = () => {
    if (!selectedSkin) {
      toast.error("Veuillez sélectionner un skin avant de continuer");
      return;
    }
    
    console.log("Confirming skin selection:", selectedSkin.id);
    navigate('/');
    toast.success("Skin confirmé ! Vous pouvez maintenant jouer.");
  };



  const isLoading = authLoading || skinsLoading;

  return (
    <div className="min-h-screen flex flex-col text-white overflow-y-auto">
      <div className="sticky top-0 z-10 flex justify-between items-center w-full p-4 bg-gray-900/80 backdrop-blur-sm">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-800/60 hover:bg-gray-700/70"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <div className="flex items-center gap-2">
          <AuthButtons />
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-2 mb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <p className="text-lg text-gray-300">Chargement des skins...</p>
          </div>
        ) : (
          <SkinSelector 
            onSelectSkin={handleSkinSelectAndSave}
            onPurchase={handlePurchase}
            showPreview={true}
            previewPattern="snake"
          />
        )}
      </main>

      <div className="fixed bottom-16 left-0 right-0 flex justify-center z-50">
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105 rounded-full w-16 h-16 shadow-lg p-0"
          onClick={handleConfirmSelection}
          disabled={!selectedSkin || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Check className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Debug Dialog */}
      <Dialog open={isDebugDialogOpen} onOpenChange={setIsDebugDialogOpen}>
        <DialogContent className="bg-gray-900 border-purple-500/30 text-white max-w-xl">
          <DialogHeader>
            <DialogTitle>Informations de débogage</DialogTitle>
            <DialogDescription className="text-gray-400">
              Détails techniques pour le débogage des skins et profil
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4 text-sm">
              <div className="bg-gray-800 p-3 rounded-md">
                <h3 className="text-purple-400 font-semibold mb-2">État actuel</h3>
                <ul className="space-y-2">
                  <li><span className="text-gray-400">User ID:</span> {user?.id || 'Non défini'}</li>
                  <li><span className="text-gray-400">Authenticated:</span> {user ? 'Oui' : 'Non'}</li>
                  <li><span className="text-gray-400">Selected Skin ID:</span> {selectedSkin?.id || 'Non défini'}</li>
                </ul>
              </div>
              
              {debugInfo && (
                <div className="bg-gray-800 p-3 rounded-md">
                  <h3 className="text-purple-400 font-semibold mb-2">Debug Info</h3>
                  <ul className="space-y-2">
                    <li><span className="text-gray-400">Last Saving Method:</span> {debugInfo.lastSavingMethod}</li>
                    <li><span className="text-gray-400">User Authenticated:</span> {debugInfo.userAuthenticated ? 'Oui' : 'Non'}</li>
                    <li><span className="text-gray-400">Profile Available:</span> {debugInfo.profileAvailable ? 'Oui' : 'Non'}</li>
                    <li><span className="text-gray-400">Owned Skins Count:</span> {debugInfo.ownedSkins?.length || 0}</li>
                  </ul>
                </div>
              )}
              
              <div className="bg-gray-800 p-3 rounded-md">
                <h3 className="text-purple-400 font-semibold mb-2">Profile Data</h3>
                <pre className="text-xs text-gray-300 overflow-x-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDebugDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default SkinsPage;
