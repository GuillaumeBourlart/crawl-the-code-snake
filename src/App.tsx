
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SkinsPage from "./pages/SkinsPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import HexBackground from "./components/HexBackground";
import LegalNotice from "./pages/LegalNotice";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import TermsOfSale from "./pages/TermsOfSale";
import CookieConsent from "./components/CookieConsent";
import ProfilePage from "./pages/ProfilePage";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

// Add CSS to handle scrolling
const styles = `
  body {
    overflow-y: auto;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }
  
  body.game-active {
    overflow: hidden;
  }

  #root, .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .content-wrapper {
    flex: 1;
  }
  
  /* Hide Lovable Badge */
  .gptengineer-badge {
    display: none !important;
  }
`;

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const [isGameActive, setIsGameActive] = useState(false);
  
  // Check if we're on the game page and game is active
  useEffect(() => {
    const isHomePage = location.pathname === '/';
    const gameActiveFromBody = document.body.classList.contains('game-active');
    setIsGameActive(isHomePage && gameActiveFromBody);
  }, [location.pathname]);
  
  // Add styles dynamically
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  return (
    <>
      <Toaster />
      <Sonner />
      <HexBackground paused={isGameActive} />
      <div className="min-h-screen flex flex-col">
        <CookieConsent />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/skins" element={<SkinsPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/legal-notice" element={<LegalNotice />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/terms-of-sale" element={<TermsOfSale />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
