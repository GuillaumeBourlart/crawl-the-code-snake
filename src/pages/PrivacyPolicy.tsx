
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HexBackground from "@/components/HexBackground";
import { useEffect, useState } from "react";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold mb-6 text-indigo-400">Politique de confidentialité</h1>
          
          <div className="prose prose-invert prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white max-w-none">
            <p className="text-sm text-gray-400 mb-4">Dernière mise à jour : {currentDate}</p>
            
            <p className="mb-4">Cette politique détaille la manière dont nous traitons vos données personnelles sur ce site.</p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Données collectées</h2>
            <p className="mb-2">Nous collectons exclusivement les données suivantes lors de votre inscription avec Google :</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Adresse email (via Google Sign-in)</li>
              <li>Nom d'affichage (pseudo via Google)</li>
              <li>Date de création du compte</li>
              <li>Date de dernière connexion</li>
            </ul>
            <p className="mb-4">Aucun mot de passe n'est stocké par notre site. L'authentification se fait exclusivement via Google Sign-in.</p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Données liées au jeu</h2>
            <p className="mb-2">Nous stockons également :</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Skins achetés par l'utilisateur (dates, prix, identifiants de transaction Stripe)</li>
              <li>Votre pseudo et votre score (si votre score fait partie des 1000 meilleurs scores)</li>
            </ul>
            <p className="mb-4">Ces scores sont conservés de manière illimitée.</p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Paiements</h2>
            <p className="mb-4">
              Tous les paiements sont traités exclusivement par <strong>Stripe</strong>.<br />
              Nous ne conservons jamais vos informations financières.
            </p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Suppression de compte</h2>
            <p className="mb-4">
              Vous pouvez supprimer définitivement votre compte directement depuis votre espace personnel sur notre site. 
              <strong className="text-amber-400"> Attention : cette suppression est immédiate et entraîne la perte définitive de tous vos skins achetés, ainsi que toutes vos autres données.</strong>
            </p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Données temporaires durant les parties</h2>
            <p className="mb-2">Pendant une partie, nous stockons temporairement en mémoire :</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Votre pseudo</li>
              <li>Votre score temporaire</li>
              <li>Taille de votre personnage</li>
              <li>Votre adresse IP (temporairement via Socket.io)</li>
            </ul>
            <p className="mb-4">Ces données temporaires sont immédiatement supprimées dès la fin de votre partie.</p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Sécurité des données</h2>
            <p className="mb-4">
              Nous nous engageons à sécuriser vos données et travaillons activement à renforcer les mesures de sécurité afin d'éviter tout accès non autorisé.
            </p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Vos droits</h2>
            <p className="mb-4">
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données personnelles. 
              Vous pouvez exercer ces droits en nous contactant directement à l'adresse : 
              <a href="mailto:contact.gb.entreprise@gmail.com" className="text-indigo-400 ml-1 hover:underline">contact.gb.entreprise@gmail.com</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
