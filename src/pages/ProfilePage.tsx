
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useSkins } from "@/hooks/use-skins";
import SkinPreview from "@/components/SkinPreview";
import HexBackground from "@/components/HexBackground";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const profileFormSchema = z.object({
  pseudo: z.string().min(2, {
    message: "Le pseudo doit contenir au moins 2 caractères.",
  }).max(16, { 
    message: "Le pseudo ne peut pas dépasser 16 caractères."
  }),
  skinId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage = () => {
  const { user, profile, loading: authLoading, updateProfile, supabase } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletionError, setDeletionError] = useState("");
  
  const { 
    selectedSkin, 
    selectedSkinId, 
    availableSkins, 
    loading: skinsLoading, 
    setSelectedSkin,
    refresh: refreshSkins
  } = useSkins();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      pseudo: profile?.pseudo || "",
      skinId: selectedSkinId?.toString() || "",
    },
  });

  // Redirect to home if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Update form values when profile is loaded
  useEffect(() => {
    if (profile) {
      form.setValue("pseudo", profile.pseudo || "");
    }
    if (selectedSkinId) {
      form.setValue("skinId", selectedSkinId.toString());
    }
  }, [profile, selectedSkinId, form]);
  
  useEffect(() => {
    refreshSkins();
  }, [refreshSkins]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Update profile in database
      await updateProfile({
        pseudo: data.pseudo,
        default_skin_id: data.skinId ? parseInt(data.skinId) : null
      });
      
      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !profile) return;
    
    // Verify confirmation text
    if (deleteConfirmation !== profile.pseudo) {
      setDeletionError("Veuillez saisir votre pseudo pour confirmer la suppression");
      return;
    }
    
    setIsDeleting(true);
    setDeletionError("");
    try {
      // Delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      // Delete user account from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) throw authError;
      
      // Sign out the user
      await supabase.auth.signOut();
      
      toast.success("Votre compte a été supprimé avec succès");
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Erreur lors de la suppression du compte");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || skinsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Vous devez être connecté pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      <HexBackground />
      <div className="container mx-auto py-12 px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mon Profil</h1>
          
          <div className="bg-gray-900/70 border border-gray-800 rounded-lg p-6 mb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="pseudo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pseudo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Votre pseudo" 
                          className="bg-gray-800/60 border-gray-700"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="skinId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skin par défaut</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormControl>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="bg-gray-800/60 border-gray-700">
                              <SelectValue placeholder="Sélectionner un skin" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700 text-white">
                              {availableSkins?.map(skin => (
                                <SelectItem key={skin.id} value={skin.id.toString()}>
                                  {skin.name || `Skin #${skin.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <div className="flex items-center justify-center h-32 bg-gray-800/40 rounded-lg p-2">
                          {field.value ? (
                            <SkinPreview 
                              skin={availableSkins?.find(s => s.id.toString() === field.value)} 
                              size="medium" 
                              animate={true} 
                              pattern="snake" 
                            />
                          ) : (
                            <p className="text-gray-400 text-center">Sélectionnez un skin</p>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="bg-red-900/30 border border-red-900/50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h2>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer mon compte
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-400">
                    Supprimer votre compte ?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    Cette action est irréversible. Elle entraînera la suppression de toutes vos données personnelles, 
                    y compris vos skins achetés et votre historique de jeu.
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1">
                        Pour confirmer, saisissez votre pseudo : <strong>{profile.pseudo}</strong>
                      </label>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white w-full"
                        placeholder={profile.pseudo}
                      />
                      {deletionError && (
                        <p className="text-red-400 text-sm mt-1">{deletionError}</p>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white">
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer définitivement"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
