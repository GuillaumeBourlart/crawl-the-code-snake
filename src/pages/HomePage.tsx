
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AuthButtons from "@/components/AuthButtons";
import ZigzagTitle from "@/components/ZigzagTitle";
import AnimatedArrow from "@/components/AnimatedArrow";
import Footer from "@/components/Footer";
import GlobalLeaderboardButton from "@/components/GlobalLeaderboardButton";
import { useAuth } from "@/hooks/use-auth";
import { useSkins } from "@/hooks/use-skins";
import SkinPreview from "@/components/SkinPreview";

const HomePage = () => {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { 
    selectedSkin, 
    selectedSkinId, 
    loading: skinsLoading, 
    refresh: refreshSkins
  } = useSkins();
  
  const [username, setUsername] = useState<string>("");
  const [skinLoadAttempted, setSkinLoadAttempted] = useState(false);
  const navigate = useNavigate();
  
  // Load initial skins
  useEffect(() => {
    if (!skinLoadAttempted) {
      console.log("Initial skins refresh");
      refreshSkins();
      setSkinLoadAttempted(true);
    }
  }, [skinLoadAttempted, refreshSkins]);
  
  // Set username from profile if available
  useEffect(() => {
    if (profile && profile.pseudo) {
      setUsername(profile.pseudo);
    }
  }, [profile]);
  
  const handlePlay = () => {
    if (!username.trim()) {
      toast.error("Veuillez entrer un pseudo avant de jouer");
      return;
    }
    
    if (user && profile && username !== profile.pseudo) {
      updateProfile({ pseudo: username });
    }
    
    if (!selectedSkinId) {
      toast.error("Veuillez sélectionner un skin avant de jouer");
      return;
    }
    
    navigate('/game');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const isLoading = authLoading || skinsLoading;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <AuthButtons />
      </div>

      <GlobalLeaderboardButton />

      <div className="z-10 flex flex-col items-center justify-center p-8 rounded-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center mb-6">
          <ZigzagTitle className="w-full" />
        </div>
        
        <div className="w-full max-w-sm mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <User className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Entrez votre pseudo"
              value={username}
              onChange={handleUsernameChange}
              className="text-white bg-gray-800/60 border-gray-700/70 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 py-6 rounded-full"
              maxLength={16}
              required
            />
          </div>
        </div>
        
        <div className="w-full mb-6">
          <Link to="/skins" className="block bg-gray-800/40 rounded-full p-4 border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
            {isLoading ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
              </div>
            ) : (
              selectedSkin ? (
                <div className="flex flex-col items-center">
                  <SkinPreview skin={selectedSkin} size="medium" animate={true} pattern="snake" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <p className="text-gray-400">Aucun skin sélectionné</p>
                  <p className="text-xs text-indigo-400 mt-2">Cliquez pour en choisir un</p>
                </div>
              )
            )}
          </Link>
        </div>
        
        <div className="flex flex-col w-full gap-3">
          <button
            className="relative w-full flex flex-col items-center justify-center mx-auto transition-all duration-300 h-32 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePlay}
            disabled={!username.trim() || !selectedSkinId || isLoading}
          >
            <AnimatedArrow 
              className="w-full h-32" 
              isClickable={Boolean(username.trim() && selectedSkinId && !isLoading)}
            />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
