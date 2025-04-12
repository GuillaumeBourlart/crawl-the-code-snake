
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold mb-6 text-white">Politique de confidentialité</h1>
          <p>Dernière mise à jour : {currentDate}</p>
          
          <p className="my-4">
            Cette politique détaille la manière dont nous traitons vos données personnelles sur ce site.
          </p>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Données collectées</h2>
              <p>
                Nous collectons exclusivement les données suivantes lors de votre inscription avec Google :
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Adresse email (via Google Sign-in)</li>
                <li>Nom d'affichage (pseudo via Google)</li>
                <li>Date de création du compte</li>
                <li>Date de dernière connexion</li>
              </ul>
              <p className="mt-2">
                Aucun mot de passe n'est stocké par notre site. L'authentification se fait exclusivement via Google Sign-in.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Données liées au jeu</h2>
              <p>
                Nous stockons également :
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Skins achetés par l'utilisateur (dates, prix, identifiants de transaction Stripe)</li>
                <li>Votre pseudo et votre score (si votre score fait partie des 1000 meilleurs scores)</li>
              </ul>
              <p className="mt-2">
                Ces scores sont conservés de manière illimitée.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Paiements</h2>
              <p>
                Tous les paiements sont traités exclusivement par <strong>Stripe</strong>.<br />
                Nous ne conservons jamais vos informations financières.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Suppression de compte</h2>
              <p>
                Vous pouvez supprimer définitivement votre compte directement depuis votre espace personnel sur notre site. 
                <strong> Attention : cette suppression est immédiate et entraîne la perte définitive de tous vos skins achetés, ainsi que toutes vos autres données.</strong>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Données temporaires durant les parties</h2>
              <p>
                Pendant une partie, nous stockons temporairement en mémoire :
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>Votre pseudo</li>
                <li>Votre score temporaire</li>
                <li>Taille de votre personnage</li>
                <li>Votre adresse IP (temporairement via Socket.io)</li>
              </ul>
              <p className="mt-2">
                Ces données temporaires sont immédiatement supprimées dès la fin de votre partie.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Sécurité des données</h2>
              <p>
                Nous nous engageons à sécuriser vos données et travaillons activement à renforcer les mesures de sécurité 
                afin d'éviter tout accès non autorisé.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Vos droits</h2>
              <p>
                Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité 
                de vos données personnelles. Vous pouvez exercer ces droits en nous contactant directement à l'adresse : 
                contact.gb.entreprise@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
