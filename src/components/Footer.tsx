
import { Link } from "react-router-dom";
import { FileText, Shield, Cookie, ShoppingBag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Footer = () => {
  const isMobile = useIsMobile();
  
  return (
    <footer className={`w-full py-3 px-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800/50 ${isMobile ? 'mt-14 pb-20' : 'mt-auto'}`}>
      <div className="container mx-auto">
        <div className={`flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-400 ${isMobile ? 'text-xs' : ''}`}>
          <Link to="/legal-notice" className="flex items-center hover:text-indigo-400 transition-colors">
            <FileText className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>Mentions légales</span>
          </Link>
          <Link to="/privacy-policy" className="flex items-center hover:text-indigo-400 transition-colors">
            <Shield className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>Politique de confidentialité</span>
          </Link>
          <Link to="/cookie-policy" className="flex items-center hover:text-indigo-400 transition-colors">
            <Cookie className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>Politique relative aux cookies</span>
          </Link>
          <Link to="/terms-of-sale" className="flex items-center hover:text-indigo-400 transition-colors">
            <ShoppingBag className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>Conditions de vente</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
