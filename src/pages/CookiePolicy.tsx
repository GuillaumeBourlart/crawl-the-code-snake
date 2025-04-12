
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HexBackground from "@/components/HexBackground";
import { useEffect, useState } from "react";

const CookiePolicy = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-hidden">
      <HexBackground />
      
      <div className="fixed top-4 left-4 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-800/60 hover:bg-gray-700/70"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-16 relative z-10 overflow-auto">
        <div className="max-w-3xl mx-auto bg-gray-900/70 backdrop-blur-sm p-8 rounded-xl border border-gray-800/50">
          <h1 className="text-3xl font-bold mb-6 text-indigo-400">Politique relative aux cookies</h1>
          
          <div className="prose prose-invert prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white max-w-none">
            <p className="text-sm text-gray-400 mb-4">Dernière mise à jour : {currentDate}</p>
            
            <p className="mb-4">Notre site utilise uniquement des cookies strictement nécessaires au fonctionnement :</p>
            
            <ul className="mb-6 space-y-3">
              <li>
                <strong className="text-indigo-300">Cookies techniques</strong> : 
                <span className="ml-1">pour gérer votre connexion au jeu (connexion via Google) et votre session de paiement sécurisée via Stripe.</span>
              </li>
              <li>
                <strong className="text-indigo-300">Cookies de préférences</strong> : 
                <span className="ml-1">mémorisent vos préférences d'utilisation (comme le thème ou les paramètres du jeu).</span>
              </li>
            </ul>
            
            <p className="mb-6">Nous n'utilisons <strong className="text-amber-400">aucun cookie analytique ou publicitaire</strong>.</p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Consentement</h2>
            <p className="mb-4">
              Ces cookies étant strictement nécessaires, votre consentement explicite n'est pas requis.<br />
              Toutefois, vous pouvez paramétrer votre navigateur pour bloquer ces cookies, mais cela risque de perturber le bon fonctionnement du site.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CookiePolicy;
