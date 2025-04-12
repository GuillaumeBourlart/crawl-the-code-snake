
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
            <p className="text-gray-300 italic">Le contenu de la politique de confidentialité sera ajouté ultérieurement.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
