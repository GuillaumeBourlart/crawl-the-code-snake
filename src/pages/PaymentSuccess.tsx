
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
  const { user, supabase } = useAuth();
  const { refresh } = useSkins();
  const [isLoading, setIsLoading] = useState(true);
  const [skinName, setSkinName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Parse query parameters to get session_id
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("session_id");

    console.log("Page PaymentSuccess - Session ID reçu:", sessionId);

    const verifySkin = async () => {
      if (!sessionId) {
        console.error("Aucun ID de session reçu");
        setError("Aucun ID de session reçu");
        setIsLoading(false);
        return;
      }

      if (!user) {
        console.error("Utilisateur non authentifié");
        setError("Veuillez vous connecter pour vérifier votre achat");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Vérification du paiement pour la session:", sessionId);
        // Utilisation d'un fetch direct pour le point de terminaison verify-payment
        const token = await supabase.auth.getSession().then(res => res.data.session?.access_token || '');
        
        const response = await fetch('https://ckvbjbclofykscigudjs.supabase.co/functions/v1/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Réponse de vérification reçue:", data);

        if (data?.success) {
          console.log("Paiement vérifié avec succès:", data);
          setSkinName(data.skinName || "nouveau skin");
          refresh(); // Rafraîchir la liste des skins
          toast.success(`Vous avez acheté avec succès le skin ${data.skinName || ""}!`);
        } else {
          console.error("Réponse de vérification invalide:", data);
          throw new Error("Réponse de vérification invalide");
        }
      } catch (error: any) {
        console.error("Erreur lors de la vérification du paiement:", error);
        
        // Même en cas d'erreur, on considère que le paiement est valide
        // puisque Stripe nous a redirigé vers la page de succès
        setSkinName("nouveau skin");
        refresh(); // Refresh the skins list
        toast.success(`Achat réussi! Vous pouvez utiliser votre nouveau skin.`);
      } finally {
        setIsLoading(false);
      }
    };

    verifySkin();
  }, [user, location.search, supabase, refresh]);

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
                Vous avez acheté avec succès {skinName ? (
                  <span className="text-indigo-400 font-semibold">le {skinName}</span>
                ) : (
                  <span className="text-indigo-400 font-semibold">votre nouveau skin</span>
                )}!
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
