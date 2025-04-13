
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Footer from "@/components/Footer";
import AuthButtons from "@/components/AuthButtons";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full py-4 px-6 flex justify-between items-center z-10">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-gray-800/30"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <AuthButtons />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-gray-900/70 border border-blue-500/30 rounded-lg p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Profil Utilisateur</h1>
          <p className="text-gray-300 mb-4">
            Cette page sera développée pour permettre aux utilisateurs de modifier leur pseudo et leur skin par défaut,
            ainsi que de supprimer leur compte.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
