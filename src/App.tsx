
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { useEffect } from "react";
import { eventBus, visibilityManager } from "./lib/event-bus";
import loadingState from "./lib/loading-states";

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
  // Add styles dynamically and initialize visibility management
  useEffect(() => {
    // Add CSS styles
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
    
    // Initialize visibility manager
    visibilityManager.initialize();
    console.log("App: Visibility manager initialized");
    
    // Reset all loading states on visibility change to prevent stuck states
    const visibilitySubscription = eventBus.subscribe(
      'documentBecameVisible',
      () => {
        console.log("App: Document became visible, resetting any stuck loading states");
        // Give a short delay to allow any in-progress operations to complete
        setTimeout(() => {
          const loadingOps = loadingState.getAllLoadingOperations();
          if (loadingOps.length > 0) {
            console.warn("App: Detected stuck loading operations, resetting:", loadingOps);
            loadingState.resetAllLoadingStates();
          }
        }, 2000);
      }
    );
    
    // Setup global error handler for loading states
    const loadingErrorSubscription = eventBus.subscribe(
      'loading:failed', 
      (data) => console.error("Loading state error:", data)
    );
    
    // Setup debugging for skin events
    let debugSubscriptions = [];
    if (process.env.NODE_ENV === 'development') {
      // Debug event subscriptions
      debugSubscriptions = [
        eventBus.subscribe('skins:loading', () => console.debug("DEBUG: Skins loading event")),
        eventBus.subscribe('skins:loaded', () => console.debug("DEBUG: Skins loaded event")),
        eventBus.subscribe('skins:error', (data) => console.debug("DEBUG: Skins error event", data)),
        eventBus.subscribe('skins:refreshing', () => console.debug("DEBUG: Skins refreshing event")),
        eventBus.subscribe('skins:refresh_complete', () => console.debug("DEBUG: Skins refresh complete event")),
        eventBus.subscribe('skins:skin_selected', (data) => console.debug("DEBUG: Skin selected event", data))
      ];
    }
    
    // Clean up function
    return () => {
      // Remove style element
      document.head.removeChild(styleElement);
      
      // Clean up visibility manager
      visibilityManager.cleanup();
      
      // Clean up subscriptions
      visibilitySubscription.unsubscribe();
      loadingErrorSubscription.unsubscribe();
      debugSubscriptions.forEach(sub => sub.unsubscribe());
      
      // Clear any pending loading states
      loadingState.clearLoadingState('fetch_all_skins');
      loadingState.clearLoadingState('refresh_skins');
      console.log("App: All resources cleaned up");
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
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
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
