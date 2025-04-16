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
        // Cookie consent
        "cookie_title": {
          fr: "Utilisation de cookies",
          en: "Cookie Usage",
          es: "Uso de cookies",
          de: "Cookie-Nutzung"
        },
        "cookie_message": {
          fr: "Nous utilisons des cookies nécessaires au fonctionnement du site.",
          en: "We use cookies necessary for the site to function.",
          es: "Utilizamos cookies necesarias para el funcionamiento del sitio.",
          de: "Wir verwenden Cookies, die für die Funktionalität der Website erforderlich sind."
        },
        "cookie_accept": {
          fr: "OK",
          en: "OK",
          es: "OK",
          de: "OK"
        },
        
        // Footer
        "legal_notice": {
          fr: "Mentions légales",
          en: "Legal Notice",
          es: "Aviso Legal",
          de: "Rechtliche Hinweise"
        },
        "privacy_policy": {
          fr: "Politique de confidentialité",
          en: "Privacy Policy",
          es: "Política de Privacidad",
          de: "Datenschutzerklärung"
        },
        "cookie_policy": {
          fr: "Politique relative aux cookies",
          en: "Cookie Policy",
          es: "Política de Cookies",
          de: "Cookie-Richtlinie"
        },
        "terms_of_sale": {
          fr: "Conditions de vente",
          en: "Terms of Sale",
          es: "Condiciones de Venta",
          de: "Verkaufsbedingungen"
        },
        
        // Profile page
        "user_profile": {
          fr: "Profil Utilisateur",
          en: "User Profile",
          es: "Perfil de Usuario",
          de: "Benutzerprofil"
        },
        "modify": {
          fr: "Modifier",
          en: "Modify",
          es: "Modificar",
          de: "Ändern"
        },
        "delete_account_button": {
          fr: "Supprimer",
          en: "Delete",
          es: "Eliminar",
          de: "Löschen"
        },
        "delete_account_title": {
          fr: "Supprimer votre compte",
          en: "Delete your account",
          es: "Eliminar tu cuenta",
          de: "Konto löschen"
        },
        "delete_account_description": {
          fr: "Supprimer définitivement votre compte et toutes vos données associées.",
          en: "Permanently delete your account and all associated data.",
          es: "Eliminar permanentemente tu cuenta y todos los datos asociados.",
          de: "Lösche dein Konto und alle zugehörigen Daten dauerhaft."
        },
        "delete_account_warning": {
          fr: "En supprimant votre compte, vous perdrez définitivement :",
          en: "By deleting your account, you will permanently lose:",
          es: "Al eliminar tu cuenta, perderás permanentemente:",
          de: "Durch das Löschen deines Kontos verlierst du dauerhaft:"
        },
        "delete_account_items": {
          fr: "Tous vos skins achetés",
          en: "All your purchased skins",
          es: "Todas tus skins compradas",
          de: "Alle gekauften Skins"
        },
        "delete_account_history": {
          fr: "Votre historique de jeu",
          en: "Your game history",
          es: "Tu historial de juego",
          de: "Deine Spielhistorie"
        },
        "delete_account_rankings": {
          fr: "Votre place dans les classements",
          en: "Your place in the rankings",
          es: "Tu posición en las clasificaciones",
          de: "Deine Position in den Ranglisten"
        },
        "delete_account_data": {
          fr: "Toutes vos données personnelles",
          en: "All your personal data",
          es: "Todos tus datos personales",
          de: "Alle deine persönlichen Daten"
        },
        "please_enter_pseudo": {
          fr: "Veuillez entrer un pseudo",
          en: "Please enter a username",
          es: "Por favor, introduce un nombre de usuario",
          de: "Bitte gib einen Benutzernamen ein"
        },
        "please_select_skin": {
          fr: "Veuillez sélectionner un skin",
          en: "Please select a skin",
          es: "Por favor, selecciona un skin",
          de: "Bitte wähle einen Skin aus"
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
        "continue": {
          fr: "Continuer",
          en: "Continue",
          es: "Continuar",
          de: "Weiter"
        },
        "deleting": {
          fr: "Suppression en cours...",
          en: "Deleting...",
          es: "Eliminando...",
          de: "Wird gelöscht..."
        },
        
        // Game elements
        "connecting": {
          fr: "Connexion en cours...",
          en: "Connecting...",
          es: "Conectando...",
          de: "Verbindung wird hergestellt..."
        },
        "connected": {
          fr: "Connecté au serveur",
          en: "Connected to server",
          es: "Conectado al servidor",
          de: "Mit Server verbunden"
        },
        "connection_error": {
          fr: "Erreur de connexion au serveur",
          en: "Server connection error",
          es: "Error de conexión al servidor",
          de: "Serververbindungsfehler"
        },
        "disconnected": {
          fr: "Déconnecté du serveur",
          en: "Disconnected from server",
          es: "Desconectado del servidor",
          de: "Vom Server getrennt"
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
