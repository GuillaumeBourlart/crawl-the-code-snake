
import { Link } from "react-router-dom";
import { FileText, Shield, Cookie, ShoppingBag } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  return (
    <footer className="w-full py-2 px-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800/50 mt-auto">
      <div className="container mx-auto">
        <div className={`flex flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-gray-400 ${isMobile ? 'text-[10px]' : ''}`}>
          <Link to="/legal-notice" className="flex items-center hover:text-indigo-400 transition-colors">
            <FileText className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>{t('legal_notice')}</span>
          </Link>
          <Link to="/privacy-policy" className="flex items-center hover:text-indigo-400 transition-colors">
            <Shield className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>{t('privacy_policy')}</span>
          </Link>
          <Link to="/cookie-policy" className="flex items-center hover:text-indigo-400 transition-colors">
            <Cookie className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>{t('cookie_policy')}</span>
          </Link>
          <Link to="/terms-of-sale" className="flex items-center hover:text-indigo-400 transition-colors">
            <ShoppingBag className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
            <span>{t('terms_of_sale')}</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
