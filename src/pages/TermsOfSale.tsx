
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HexBackground from "@/components/HexBackground";

const TermsOfSale = () => {
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
          <h1 className="text-3xl font-bold mb-6 text-indigo-400">Conditions de vente</h1>
          
          <div className="prose prose-invert max-w-none">
            {/* Le contenu sera ajouté par l'utilisateur */}
            <p className="text-gray-300 italic"># Conditions de vente – Skins et achats intégrés

Dernière mise à jour : [DATE DU JOUR]

En achetant un skin ou tout autre contenu numérique sur notre site, vous acceptez expressément que ce contenu soit mis immédiatement à votre disposition. Conformément à l’article L.221-28 du Code de la consommation, vous renoncez explicitement à votre droit de rétractation dès l’achat validé.

## Aucun remboursement

En raison de la nature numérique immédiate du contenu acheté, aucun remboursement ne sera accordé après validation de l’achat.

## Achats par les mineurs

Si vous êtes âgé de moins de 16 ans, vous devez obligatoirement avoir l’accord explicite de vos parents ou responsables légaux avant tout achat effectué sur ce site. En validant un achat, vous reconnaissez avoir obtenu cet accord.

## Gestion des transactions

Tous les paiements sont traités exclusivement par notre prestataire Stripe. Aucune donnée bancaire n'est stockée directement sur nos serveurs.

Pour toute question sur une transaction, vous pouvez nous contacter à l'adresse :  
**contact.gb.entreprise@gmail.com**
</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfSale;
