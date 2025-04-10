
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSkins } from "@/hooks/use-skins";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, supabase } = useAuth();
  const { refresh } = useSkins();
  const [isLoading, setIsLoading] = useState(true);
  const [skinName, setSkinName] = useState<string | null>(null);

  useEffect(() => {
    // Parse query parameters to get session_id
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("session_id");

    const verifySkin = async () => {
      if (!sessionId || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify the payment with your backend
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId }
        });

        if (error) throw error;

        if (data?.success) {
          setSkinName(data.skinName || "new skin");
          refresh(); // Refresh the skins list
          toast.success(`You've successfully purchased the ${data.skinName || "skin"}!`);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast.error("There was an issue verifying your purchase");
      } finally {
        setIsLoading(false);
      }
    };

    verifySkin();
  }, [user, location.search, supabase]);

  // Auto-redirect after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        navigate("/skins");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 text-white p-4">
      <div className="max-w-md w-full p-8 bg-gray-900/70 backdrop-blur-lg rounded-2xl border border-indigo-500/20 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-20 w-20 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Payment Successful!
          </h1>
          
          {isLoading ? (
            <p className="text-gray-300">Verifying your purchase...</p>
          ) : skinName ? (
            <p className="text-gray-300">
              You've successfully purchased the <span className="text-indigo-400 font-semibold">{skinName}</span>!
            </p>
          ) : (
            <p className="text-gray-300">
              Your purchase has been completed successfully.
            </p>
          )}
          
          <p className="text-sm text-gray-400 mt-4">
            You'll be redirected to the skins page in a few seconds.
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link to="/skins">
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            >
              Go to Skins
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="w-full">
              Back to Game
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
