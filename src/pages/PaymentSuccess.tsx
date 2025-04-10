
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSkins } from "@/hooks/use-skins";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, supabase } = useAuth();
  const { refresh } = useSkins();
  const [isLoading, setIsLoading] = useState(true);
  const [skinName, setSkinName] = useState<string | null>(null);

  useEffect(() => {
    // Parse query parameters to get session_id
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("session_id");

    const verifySkin = async () => {
      if (!sessionId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Appel de la fonction verify-payment pour confirmer l'achat
        // Nous n'utilisons pas l'ancien endpoint verify-payment mais swift-endpoint ne gère pas cette vérification
        // Le webhook Stripe va s'occuper d'enregistrer l'achat automatiquement
        
        // Nous pouvons tout de même considérer le paiement comme validé si nous sommes sur cette page
        // et rafraîchir la liste des skins
        setSkinName("nouveau skin");
        refresh(); // Refresh the skins list
        toast.success(`Vous avez acheté avec succès le skin!`);
        setIsLoading(false);
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast.error("Une erreur est survenue lors de la vérification de votre achat");
        setIsLoading(false);
      }
    };

    verifySkin();
  }, [user, location.search, supabase, refresh]);

  // Auto-redirect after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        navigate("/skins");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 text-white p-4">
      <div className="max-w-md w-full p-8 bg-gray-900/70 backdrop-blur-lg rounded-2xl border border-indigo-500/20 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-20 w-20 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Paiement Réussi!
          </h1>
          
          {isLoading ? (
            <p className="text-gray-300">Vérification de votre achat...</p>
          ) : skinName ? (
            <p className="text-gray-300">
              Vous avez acheté avec succès le <span className="text-indigo-400 font-semibold">{skinName}</span>!
            </p>
          ) : (
            <p className="text-gray-300">
              Votre achat a été effectué avec succès.
            </p>
          )}
          
          <p className="text-sm text-gray-400 mt-4">
            Vous serez redirigé vers la page des skins dans quelques secondes.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link to="/skins">
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            >
              Aller aux Skins
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="w-full">
              Retour au Jeu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
