
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HexBackground from "@/components/HexBackground";
import { ScrollArea } from "@/components/ui/scroll-area";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

const LegalNotice = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen w-full text-white">      
      <div className="sticky top-4 left-4 z-20 p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-gray-800/60 hover:bg-gray-700/70"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto bg-gray-900/70 backdrop-blur-sm p-6 rounded-xl border border-gray-800/50">
          <h1 className="text-3xl font-bold mb-6 text-indigo-400">Mentions légales</h1>
          
          <div className="prose prose-invert prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white max-w-none">
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Éditeur du site</h2>
            <p className="mb-4">
              <strong>Guillaume Bourlart</strong> (Auto-entrepreneur)<br />
              Code APE : 5829C – Édition de logiciels applicatifs<br />
              Email : <a href="mailto:contact.gb.entreprise@gmail.com" className="text-indigo-400 hover:underline">contact.gb.entreprise@gmail.com</a><br />
              Pays : France
            </p>
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Hébergeur du site</h2>
            <p className="mb-4">
              Hostinger France<br />
              61 rue Lordou Vironos, 6023 Larnaca, Chypre<br />
              Site web : <a href="https://www.hostinger.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">https://www.hostinger.fr</a>
            </p>
            
            <hr className="border-gray-700 my-6" />
            
            <h2 className="text-xl font-semibold text-indigo-300 mt-6 mb-4">Contact</h2>
            <p className="mb-4">
              Pour toute question ou réclamation concernant ce site, contactez :<br />
              <strong className="text-indigo-400">contact.gb.entreprise@gmail.com</strong>
            </p>
          </div>
        </div>
      </main>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default LegalNotice;
