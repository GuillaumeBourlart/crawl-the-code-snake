
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
  const { user, profile, supabase, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);

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
      {/* Header with back button and auth button */}
      <div className="flex justify-between items-center w-full p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-800/60 hover:bg-gray-700/70"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <AuthButtons />
      </div>

      <main className="flex-1 container mx-auto px-4 py-2 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
            <p className="text-lg text-gray-300">Chargement des skins...</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-170px)] pr-4">
            <SkinSelector 
              onSelectSkin={handleSkinSelectAndSave}
              onPurchase={handlePurchase}
              showPreview={true}
              previewPattern="snake"
            />
          </ScrollArea>
        )}
      </main>

      {/* Floating confirmation button at bottom */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
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
    </div>
  );
};

export default SkinsPage;
