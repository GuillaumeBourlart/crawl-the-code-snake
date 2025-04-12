
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CookiePolicy = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-800/60 hover:bg-gray-700/70 mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6 text-white">Politique relative aux cookies</h1>
          <p>Dernière mise à jour : {currentDate}</p>
          
          <p className="my-4">
            Notre site utilise uniquement des cookies strictement nécessaires au fonctionnement :
          </p>

          <div className="space-y-6">
            <div>
              <ul className="list-disc pl-6 mt-2">
                <li>
                  <strong>Cookies techniques</strong> : pour gérer votre connexion au jeu (connexion via Google) 
                  et votre session de paiement sécurisée via Stripe.
                </li>
                <li>
                  <strong>Cookies de préférences</strong> : mémorisent vos préférences d'utilisation 
                  (comme le thème ou les paramètres du jeu).
                </li>
              </ul>
              <p className="mt-4">
                Nous n'utilisons <strong>aucun cookie analytique ou publicitaire</strong>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Consentement</h2>
              <p>
                Ces cookies étant strictement nécessaires, votre consentement explicite n'est pas requis.<br />
                Toutefois, vous pouvez paramétrer votre navigateur pour bloquer ces cookies, 
                mais cela risque de perturber le bon fonctionnement du site.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
