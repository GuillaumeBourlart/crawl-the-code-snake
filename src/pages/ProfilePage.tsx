
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, User } from "lucide-react";

const ProfilePage = () => {
  const { user, profile, loading } = useAuth();

  // Redirect to home if not logged in
  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">Profil Joueur</h1>
      
      {loading ? (
        <Card className="bg-gray-900/70 border-blue-500/30 text-white shadow-lg">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mr-2" />
            <span>Chargement du profil...</span>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-900/70 border-green-500/30 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <User className="h-6 w-6 text-green-400 mr-2" />
              Informations du profil
            </CardTitle>
          </CardHeader>
          <Separator className="bg-green-500/30" />
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-300">Email</h3>
                <p className="text-white">{user?.email}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-300">Pseudo</h3>
                <p className="text-white">{profile?.pseudo || "Non défini"}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-300">Nombre de skins</h3>
                <p className="text-white">{profile?.skins?.length || 0}</p>
              </div>
            </div>
            
            <div className="mt-8">
              <Button 
                variant="outline" 
                className="bg-blue-900/30 border-blue-500/30 hover:bg-blue-900/50 text-white"
                onClick={() => window.location.href = "/skins"}
              >
                Voir mes skins
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
