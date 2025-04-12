
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900/70 backdrop-blur-sm border-t border-gray-800 py-6 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/legal-notice" className="text-gray-400 hover:text-white transition-colors">
              Mentions Légales
            </Link>
            <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
              Politique de Confidentialité
            </Link>
            <Link to="/cookie-policy" className="text-gray-400 hover:text-white transition-colors">
              Politique des Cookies
            </Link>
            <Link to="/terms-of-sale" className="text-gray-400 hover:text-white transition-colors">
              Conditions de Vente
            </Link>
          </nav>
          
          <div className="text-gray-500 text-xs">
            &copy; {currentYear} Guillaume Bourlart. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
