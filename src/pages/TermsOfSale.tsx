
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HexBackground from "@/components/HexBackground";
import { useEffect, useState } from "react";

const TermsOfSale = () => {
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
      
      <main className="flex-1 container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-3xl mx-auto bg-gray-900/70 backdrop-blur-sm p-8 rounded-xl border border-gray-800/50">
          <h1 className="text-3xl font-bold mb-6 text-indigo-400">Conditions de vente</h1>
          
          <div className="prose prose-invert prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white max-w-none">
            <p className="text-sm text-gray-400 mb-4">Dernière mise à jour : {currentDate}</p>
            
            <p className="mb-6">
              En achetant un skin ou tout autre contenu numérique sur notre site, vous acceptez expressément que ce contenu soit mis immédiatement à votre disposition. 
              Conformément à l'article L.221-28 du Code de la consommation, vous renoncez explicitement à votre droit de rétractation dès l'achat validé.
            </p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Aucun remboursement</h2>
            <p className="mb-4">
              En raison de la nature numérique immédiate du contenu acheté, aucun remboursement ne sera accordé après validation de l'achat.
            </p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Achats par les mineurs</h2>
            <p className="mb-4">
              Si vous êtes âgé de moins de 16 ans, vous devez obligatoirement avoir l'accord explicite de vos parents ou responsables légaux 
              avant tout achat effectué sur ce site. En validant un achat, vous reconnaissez avoir obtenu cet accord.
            </p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Gestion des transactions</h2>
            <p className="mb-4">
              Tous les paiements sont traités exclusivement par notre prestataire Stripe. Aucune donnée bancaire n'est stockée directement sur nos serveurs.
            </p>
            
            <p className="mb-4">
              Pour toute question sur une transaction, vous pouvez nous contacter à l'adresse :<br />
              <strong className="text-indigo-400">contact.gb.entreprise@gmail.com</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfSale;
