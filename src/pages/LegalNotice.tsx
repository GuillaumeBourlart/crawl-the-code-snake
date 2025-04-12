
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HexBackground from "@/components/HexBackground";

const LegalNotice = () => {
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
          <h1 className="text-3xl font-bold mb-6 text-indigo-400">Mentions légales</h1>
          
          <div className="prose prose-invert max-w-none">
            {/* Le contenu sera ajouté par l'utilisateur */}
            <p className="text-gray-300 italic"># Mentions légales

**Éditeur du site :**  
Guillaume Bourlart (Auto-entrepreneur)  
Code APE : 5829C – Édition de logiciels applicatifs  
Email : contact.gb.entreprise@gmail.com  
Pays : France  

**Hébergeur du site :**  
Hostinger France  
61 rue Lordou Vironos, 6023 Larnaca, Chypre  
Site web : [https://www.hostinger.fr](https://www.hostinger.fr)

---

## Contact

Pour toute question ou réclamation concernant ce site, contactez :  
**contact.gb.entreprise@gmail.com**
</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalNotice;
