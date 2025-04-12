
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookiesAccepted = localStorage.getItem("cookiesAccepted");
    if (!cookiesAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
        >
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30 shadow-lg">
            <div className="flex items-start">
              <Cookie className="h-6 w-6 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <p className="text-white text-sm mb-3">
                  Ce site utilise des cookies nécessaires au fonctionnement du site et à l'enregistrement des préférences utilisateur. Ces cookies ne nécessitent pas votre consentement.
                </p>
                <div className="flex justify-end">
                  <Button
                    onClick={handleAccept}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    OK
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
