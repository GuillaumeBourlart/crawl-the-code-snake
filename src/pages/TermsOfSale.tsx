
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfSale = () => {
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
          <h1 className="text-3xl font-bold mb-6 text-white">Conditions de vente – Skins et achats intégrés</h1>
          <p>Dernière mise à jour : {currentDate}</p>
          
          <p className="my-4">
            En achetant un skin ou tout autre contenu numérique sur notre site, vous acceptez expressément que 
            ce contenu soit mis immédiatement à votre disposition. Conformément à l'article L.221-28 du Code de la 
            consommation, vous renoncez explicitement à votre droit de rétractation dès l'achat validé.
          </p>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Aucun remboursement</h2>
              <p>
                En raison de la nature numérique immédiate du contenu acheté, aucun remboursement ne sera accordé après validation de l'achat.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Achats par les mineurs</h2>
              <p>
                Si vous êtes âgé de moins de 16 ans, vous devez obligatoirement avoir l'accord explicite de vos parents 
                ou responsables légaux avant tout achat effectué sur ce site. En validant un achat, 
                vous reconnaissez avoir obtenu cet accord.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Gestion des transactions</h2>
              <p>
                Tous les paiements sont traités exclusivement par notre prestataire Stripe. 
                Aucune donnée bancaire n'est stockée directement sur nos serveurs.
              </p>
            </div>

            <div>
              <p>
                Pour toute question sur une transaction, vous pouvez nous contacter à l'adresse :<br />
                <strong>contact.gb.entreprise@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfSale;
