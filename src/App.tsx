
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/use-auth";
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
import { useEffect } from "react";

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
`;

const queryClient = new QueryClient();

const App = () => {
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <HexBackground />
          <BrowserRouter>
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
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
