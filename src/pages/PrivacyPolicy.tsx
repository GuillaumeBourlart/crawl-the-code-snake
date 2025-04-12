
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HexBackground from "@/components/HexBackground";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

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
      
      <main className="flex-1 container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto bg-gray-900/70 backdrop-blur-sm p-8 rounded-xl border border-gray-800/50">
          <h1 className="text-3xl font-bold mb-6 text-indigo-400">Politique de confidentialité</h1>
          
          <div className="prose prose-invert max-w-none">
            {/* Le contenu sera ajouté par l'utilisateur */}
            <p className="text-gray-300 italic">L# Politique de confidentialité

Dernière mise à jour : [DATE DU JOUR]

Cette politique détaille la manière dont nous traitons vos données personnelles sur ce site.

## Données collectées

Nous collectons exclusivement les données suivantes lors de votre inscription avec Google :

- Adresse email (via Google Sign-in)
- Nom d'affichage (pseudo via Google)
- Date de création du compte
- Date de dernière connexion

Aucun mot de passe n’est stocké par notre site. L’authentification se fait exclusivement via Google Sign-in.

## Données liées au jeu

Nous stockons également :

- Skins achetés par l’utilisateur (dates, prix, identifiants de transaction Stripe)
- Votre pseudo et votre score (si votre score fait partie des 1000 meilleurs scores)

Ces scores sont conservés de manière illimitée.

## Paiements

Tous les paiements sont traités exclusivement par **Stripe**.  
Nous ne conservons jamais vos informations financières.

## Suppression de compte

Vous pouvez supprimer définitivement votre compte directement depuis votre espace personnel sur notre site. **Attention : cette suppression est immédiate et entraîne la perte définitive de tous vos skins achetés, ainsi que toutes vos autres données.**

## Données temporaires durant les parties

Pendant une partie, nous stockons temporairement en mémoire :

- Votre pseudo
- Votre score temporaire
- Taille de votre personnage
- Votre adresse IP (temporairement via Socket.io)

Ces données temporaires sont immédiatement supprimées dès la fin de votre partie.

## Sécurité des données

Nous nous engageons à sécuriser vos données et travaillons activement à renforcer les mesures de sécurité afin d'éviter tout accès non autorisé.

## Vos droits

Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données personnelles. Vous pouvez exercer ces droits en nous contactant directement à l’adresse : contact.gb.entreprise@gmail.com
</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
