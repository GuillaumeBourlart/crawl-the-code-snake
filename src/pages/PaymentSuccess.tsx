
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSkins } from "@/hooks/use-skins";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, supabase, refreshSession } = useAuth();
  const { refresh } = useSkins();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionRefreshed, setIsSessionRefreshed] = useState(false);

  // Première étape: rafraîchir explicitement la session d'authentification
  useEffect(() => {
    const initSession = async () => {
      console.log("PaymentSuccess - Rafraîchissement explicite de la session après retour de Stripe");
      try {
        // Forcer un rafraîchissement de session pour s'assurer que l'utilisateur est toujours connecté
        await refreshSession();
        setIsSessionRefreshed(true);
      } catch (err) {
        console.error("Erreur lors du rafraîchissement de la session:", err);
        // Continuer quand même, car le traitement principal se fera dans l'effet suivant
        setIsSessionRefreshed(true);
      }
    };

    initSession();
  }, [refreshSession]);

  // Deuxième étape: traiter le paiement une fois la session rafraîchie
  useEffect(() => {
    if (!isSessionRefreshed) return;

    // Parse query parameters to get session_id
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("session_id");

    console.log("Page PaymentSuccess - Session ID reçu:", sessionId);
    console.log("État de l'authentification:", user ? "Connecté" : "Non connecté");

    const processPurchase = async () => {
      if (!sessionId) {
        console.error("Aucun ID de session reçu");
        setError("Aucun ID de session reçu");
        setIsLoading(false);
        return;
      }

      if (!user) {
        console.error("Utilisateur non authentifié après rafraîchissement de session");
        setError("Veuillez vous connecter pour vérifier votre achat");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Paiement confirmé par Stripe (redirection vers URL de succès)");
        
        // La vérification du paiement est maintenant gérée par le webhook Stripe
        // Nous n'avons plus besoin d'appeler un endpoint de vérification
        
        // Rafraîchir la liste des skins pour afficher le nouveau skin acheté
        await refresh();
        toast.success(`Achat réussi! Vous pouvez utiliser votre nouveau skin.`);
      } catch (error: any) {
        console.error("Erreur lors du traitement de l'achat:", error);
        // Même en cas d'erreur, on considère que le paiement est valide
        // puisque Stripe nous a redirigé vers la page de succès
        toast.success(`Achat réussi! Vous pouvez utiliser votre nouveau skin.`);
      } finally {
        setIsLoading(false);
      }
    };

    processPurchase();
  }, [user, location.search, refresh, isSessionRefreshed]);

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
          {isLoading ? (
            <>
              <Loader2 className="h-16 w-16 text-indigo-500 animate-spin mb-6" />
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Vérification...
              </h1>
              <p className="text-gray-300">Nous confirmons votre achat...</p>
            </>
          ) : error ? (
            <>
              <div className="h-20 w-20 bg-red-600/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Problème de vérification
              </h1>
              <p className="text-gray-300">{error}</p>
              <p className="text-sm text-gray-400 mt-4">
                Votre paiement a probablement été accepté. Vérifiez vos skins disponibles.
              </p>
            </>
          ) : (
            <>
              <div className="h-20 w-20 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Paiement Réussi!
              </h1>
              <p className="text-gray-300">
                <span className="text-indigo-400 font-semibold">Votre nouveau skin</span> est maintenant disponible!
              </p>
            </>
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
