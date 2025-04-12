
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-gray-900/90 backdrop-blur-md border border-indigo-500/30 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Cookie className="h-6 w-6 text-indigo-400 mr-3 flex-shrink-0" />
              <h3 className="text-lg font-medium text-white">Utilisation de cookies</h3>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-gray-300 mb-4">
              Nous utilisons des cookies nécessaires au fonctionnement du site et à la mémorisation de vos préférences. 
            </p>
            
            <div className="flex justify-center">
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={acceptCookies}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
