
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LegalNotice = () => {
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
          <h1 className="text-3xl font-bold mb-6 text-white">Mentions légales</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Éditeur du site :</h2>
              <p>
                Guillaume Bourlart (Auto-entrepreneur)<br />
                Code APE : 5829C – Édition de logiciels applicatifs<br />
                Email : contact.gb.entreprise@gmail.com<br />
                Pays : France
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Hébergeur du site :</h2>
              <p>
                Hostinger France<br />
                61 rue Lordou Vironos, 6023 Larnaca, Chypre<br />
                Site web : <a href="https://www.hostinger.fr" className="text-blue-400 hover:underline">https://www.hostinger.fr</a>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3 text-white">Contact</h2>
              <p>
                Pour toute question ou réclamation concernant ce site, contactez :<br />
                <strong>contact.gb.entreprise@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;
