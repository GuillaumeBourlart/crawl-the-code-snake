
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if the user has already given consent
    const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY) === "true";
    
    if (!hasConsented) {
      // Show the banner after a small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${isMobile ? 'bottom-20' : 'bottom-16'} left-0 right-0 z-50 p-3 md:p-4 animate-fade-in`}>
      <div className="max-w-2xl mx-auto bg-gray-900/90 backdrop-blur-md border border-indigo-500/30 rounded-lg shadow-lg overflow-hidden">
        <div className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Cookie className="h-4 w-4 text-indigo-400 mr-2 flex-shrink-0" />
              <h3 className="text-sm font-medium text-white">{t("cookie_usage")}</h3>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-300 mr-4">
              {t("cookie_message")}
            </p>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3"
              onClick={acceptCookies}
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
