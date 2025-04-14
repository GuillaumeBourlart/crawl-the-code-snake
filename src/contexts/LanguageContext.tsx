
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

// Définir les langues disponibles
export type Language = 'fr' | 'en' | 'es' | 'de';

// Structure pour stocker les traductions
export type Translations = {
  [key: string]: {
    [key in Language]?: string;
  };
};

type LanguageContextType = {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const DEFAULT_LANGUAGE: Language = 'fr';
const LANGUAGE_COOKIE_NAME = 'app_language';

// Créer le contexte avec des valeurs par défaut
const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  changeLanguage: () => {},
  t: () => '',
});

// Hook pour utiliser le contexte
export const useLanguage = () => {
  return useContext(LanguageContext);
};

// Le provider qui va envelopper l'application
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les traductions au démarrage
  useEffect(() => {
    const loadTranslations = async () => {
      // Charger les traductions depuis les fichiers JSON
      const translationsData = {
        // Système
        "loading": {
          fr: "Chargement...",
          en: "Loading...",
          es: "Cargando...",
          de: "Wird geladen..."
        },
        "error": {
          fr: "Erreur",
          en: "Error",
          es: "Error",
          de: "Fehler"
        },
        "success": {
          fr: "Succès",
          en: "Success",
          es: "Éxito",
          de: "Erfolg"
        },
        // Auth
        "sign_in": {
          fr: "Se connecter avec Google",
          en: "Sign in with Google",
          es: "Iniciar sesión con Google",
          de: "Mit Google anmelden"
        },
        "sign_out": {
          fr: "Déconnexion",
          en: "Sign out",
          es: "Cerrar sesión",
          de: "Abmelden"
        },
        "profile": {
          fr: "Profil",
          en: "Profile",
          es: "Perfil",
          de: "Profil"
        },
        // Jeu
        "enter_username": {
          fr: "Entrez votre pseudo",
          en: "Enter your username",
          es: "Introduce tu nombre de usuario",
          de: "Gib deinen Benutzernamen ein"
        },
        "no_skin_selected": {
          fr: "Aucun skin sélectionné",
          en: "No skin selected",
          es: "Ninguna skin seleccionada",
          de: "Kein Skin ausgewählt"
        },
        "click_to_choose": {
          fr: "Cliquez pour en choisir un",
          en: "Click to choose one",
          es: "Haz clic para elegir uno",
          de: "Klicke um einen auszuwählen"
        },
        "spectator_mode": {
          fr: "Mode Spectateur",
          en: "Spectator Mode",
          es: "Modo Espectador",
          de: "Zuschauermodus"
        },
        "quit": {
          fr: "Quitter",
          en: "Quit",
          es: "Salir",
          de: "Beenden"
        },
        // Skins
        "select_skin": {
          fr: "Sélectionner un skin",
          en: "Select a skin",
          es: "Seleccionar una skin",
          de: "Skin auswählen"
        },
        "skin_selected": {
          fr: "Skin sélectionné !",
          en: "Skin selected!",
          es: "¡Skin seleccionada!",
          de: "Skin ausgewählt!"
        },
        "click_skin_play": {
          fr: "Cliquez pour changer votre skin",
          en: "Click to change your skin",
          es: "Haz clic para cambiar tu skin",
          de: "Klicke um deinen Skin zu ändern"
        },
        // Profil
        "user_profile": {
          fr: "Profil Utilisateur",
          en: "User Profile",
          es: "Perfil del Usuario",
          de: "Benutzerprofil"
        },
        "edit": {
          fr: "Modifier",
          en: "Edit",
          es: "Editar",
          de: "Bearbeiten"
        },
        "change": {
          fr: "Changer",
          en: "Change",
          es: "Cambiar",
          de: "Ändern"
        },
        "save": {
          fr: "Enregistrer",
          en: "Save",
          es: "Guardar",
          de: "Speichern"
        },
        "cancel": {
          fr: "Annuler",
          en: "Cancel",
          es: "Cancelar",
          de: "Abbrechen"
        },
        "back": {
          fr: "Retour",
          en: "Back",
          es: "Atrás",
          de: "Zurück"
        },
        "delete_account": {
          fr: "Supprimer le compte",
          en: "Delete account",
          es: "Eliminar cuenta",
          de: "Konto löschen"
        },
        "default_skin": {
          fr: "Skin par défaut",
          en: "Default skin",
          es: "Skin predeterminada",
          de: "Standard-Skin"
        },
        // Suppression de compte
        "delete_account_confirm": {
          fr: "Êtes-vous sûr de vouloir supprimer votre compte ?",
          en: "Are you sure you want to delete your account?",
          es: "¿Estás seguro de que quieres eliminar tu cuenta?",
          de: "Bist du sicher, dass du dein Konto löschen möchtest?"
        },
        "delete_forever": {
          fr: "Supprimer définitivement",
          en: "Delete permanently",
          es: "Eliminar permanentemente",
          de: "Dauerhaft löschen"
        },
        "deleting": {
          fr: "Suppression...",
          en: "Deleting...",
          es: "Eliminando...",
          de: "Wird gelöscht..."
        },
        // Langue
        "language": {
          fr: "Langue",
          en: "Language",
          es: "Idioma",
          de: "Sprache"
        },
        "french": {
          fr: "Français",
          en: "French",
          es: "Francés",
          de: "Französisch"
        },
        "english": {
          fr: "Anglais",
          en: "English",
          es: "Inglés",
          de: "Englisch"
        },
        "spanish": {
          fr: "Espagnol",
          en: "Spanish",
          es: "Español",
          de: "Spanisch"
        },
        "german": {
          fr: "Allemand",
          en: "German",
          es: "Alemán",
          de: "Deutsch"
        }
      };
      
      setTranslations(translationsData);
      setIsLoaded(true);
    };

    loadTranslations();
  }, []);

  // Charger la langue depuis le cookie au démarrage
  useEffect(() => {
    const savedLanguage = Cookies.get(LANGUAGE_COOKIE_NAME) as Language;
    if (savedLanguage && ['fr', 'en', 'es', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Gérer la visibilité de la page pour recharger si nécessaire
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Vérifier si la langue est toujours la même que dans le cookie
        const savedLanguage = Cookies.get(LANGUAGE_COOKIE_NAME) as Language;
        if (savedLanguage && savedLanguage !== language) {
          setLanguage(savedLanguage);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [language]);

  // Fonction pour changer la langue
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    Cookies.set(LANGUAGE_COOKIE_NAME, lang, { expires: 365 }); // Expire dans 1 an
  };

  // Fonction pour obtenir une traduction
  const t = (key: string): string => {
    if (!isLoaded) return key;
    
    const translation = translations[key];
    if (!translation) return key;
    
    return translation[language] || translation['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
