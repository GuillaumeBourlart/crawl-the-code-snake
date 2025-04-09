
import { useState } from "react";
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

// Your Stripe publishable key
const stripePromise = loadStripe("pk_test_your_stripe_key"); // Replace with your actual key

const SkinsPage = () => {
  const { selectedSkin, availableSkins, purchasableSkins } = useSkins();
  const { user, profile, supabase } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

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
            Back to Game
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
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Skin Preview Section */}
          <div className="w-full md:w-1/3 bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-indigo-500/20 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-center">Preview</h2>
            {selectedSkin ? (
              <div className="flex flex-col items-center">
                <SkinPreview skin={selectedSkin} size="large" animate={true} />
                <h3 className="mt-4 text-lg font-medium">{selectedSkin.name}</h3>
                {selectedSkin.description && (
                  <p className="mt-2 text-sm text-gray-300 text-center">
                    {selectedSkin.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
                No skin selected
              </div>
            )}
          </div>

          {/* Skin Selection Section */}
          <div className="w-full md:w-2/3">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Your Skins</h2>
              <p className="text-sm text-gray-300 mb-4">
                Select from your available skins
              </p>
              
              <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800 shadow-xl">
                {availableSkins.length > 0 ? (
                  <SkinSelector />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No skins available yet
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">Skin Shop</h2>
                <div className="flex items-center text-sm text-gray-300">
                  <ShoppingCart className="h-4 w-4 mr-1 text-indigo-400" />
                  Get more skins
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Purchase premium skins to stand out in the game
              </p>
              
              {!user && (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 mb-4 text-sm">
                  <p className="text-center">
                    Sign in with Google to purchase and save your skins
                  </p>
                </div>
              )}
              
              <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800 shadow-xl">
                {purchasableSkins.length > 0 ? (
                  <SkinSelector 
                    showPurchasable={true} 
                    onPurchase={handlePurchase}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No skins available for purchase
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 text-center bg-gray-900/80 text-gray-400 text-sm">
        © 2025 Code Crawl - All skins purchased are linked to your account
      </footer>
    </div>
  );
};

export default SkinsPage;
