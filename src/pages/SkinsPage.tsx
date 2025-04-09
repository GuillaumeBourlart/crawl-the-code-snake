
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSkins } from "@/hooks/use-skins";
import { useAuth } from "@/hooks/use-auth";
import SkinSelector from "@/components/SkinSelector";
import SkinPreview from "@/components/SkinPreview";
import { GameSkin } from "@/types/supabase";
import { loadStripe } from "@stripe/stripe-js";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthButtons from "@/components/AuthButtons";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Your Stripe publishable key
const stripePromise = loadStripe("pk_test_your_stripe_key"); // Replace with your actual key

const SkinsPage = () => {
  const { selectedSkin, availableSkins, purchasableSkins, setSelectedSkin } = useSkins();
  const { user, profile, supabase } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pseudo, setPseudo] = useState("");

  // Charger le pseudo enregistré si disponible
  useEffect(() => {
    const savedPseudo = localStorage.getItem('player_pseudo');
    if (savedPseudo) {
      setPseudo(savedPseudo);
    } else if (profile?.pseudo) {
      // Si l'utilisateur est connecté et a un pseudo dans son profil
      setPseudo(profile.pseudo);
    }
  }, [profile]);

  const handlePseudoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPseudo(e.target.value);
  };

  const handlePurchase = async (skin: GameSkin) => {
    if (!user) {
      toast.error("Please sign in to purchase skins");
      return;
    }

    try {
      setIsProcessing(true);
      
      // Call your Stripe checkout function
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          skinId: skin.id,
          priceAmount: skin.price,
          skinName: skin.name
        }
      });

      if (error) throw error;
      
      // Redirect to Stripe Checkout
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
    // Mettre à jour le skin sélectionné via le hook
    setSelectedSkin(skinId);
    
    // Sauvegarder le pseudo
    if (pseudo.trim()) {
      localStorage.setItem('player_pseudo', pseudo);
    }
    
    toast.success("Skin sélectionné et pseudo enregistré !");
  };

  const handleStartGame = () => {
    if (!selectedSkin) {
      toast.error("Veuillez sélectionner un skin avant de commencer");
      return;
    }
    
    if (!pseudo.trim()) {
      toast.error("Veuillez entrer un pseudo avant de commencer");
      return;
    }
    
    // Sauvegarder le pseudo et rediriger vers le jeu
    localStorage.setItem('player_pseudo', pseudo);
    navigate('/');
  };

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
        <div className="mb-6 bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800 shadow-xl">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3">
              <Input
                id="pseudo"
                value={pseudo}
                onChange={handlePseudoChange}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Entrez votre pseudo"
                maxLength={20}
              />
              <Button 
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleStartGame}
                disabled={!selectedSkin || !pseudo.trim()}
              >
                Commencer à jouer
              </Button>
            </div>
            <div className="w-full md:w-2/3 text-center">
              <p className="text-sm text-gray-300 mb-2">
                Choisissez un skin et entrez votre pseudo pour jouer
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-1">Vos skins</h2>
          <p className="text-sm text-gray-300 mb-4">
            Sélectionnez parmi vos skins disponibles
          </p>
          
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800 shadow-xl">
            {availableSkins.length > 0 ? (
              <SkinSelector 
                onSelectSkin={handleSkinSelectAndSave}
                showPreview={true}
                previewPattern="snake"
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                Aucun skin disponible pour le moment
              </div>
            )}
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
          
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800 shadow-xl">
            {purchasableSkins.length > 0 ? (
              <SkinSelector 
                showPurchasable={true} 
                onPurchase={handlePurchase}
                onSelectSkin={handleSkinSelectAndSave}
                showPreview={true}
                previewPattern="snake"
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                Aucun skin disponible à l'achat
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 text-center bg-gray-900/80 text-gray-400 text-sm">
        © 2025 Code Crawl - Tous les skins achetés sont liés à votre compte
      </footer>
    </div>
  );
};

export default SkinsPage;
