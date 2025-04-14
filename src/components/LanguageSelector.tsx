
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

const LanguageSelector = () => {
  const { language, changeLanguage, t } = useLanguage();
  const isMobile = useIsMobile();
  
  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: t('french'), flag: '🇫🇷' },
    { code: 'en', label: t('english'), flag: '🇬🇧' },
    { code: 'es', label: t('spanish'), flag: '🇪🇸' },
    { code: 'de', label: t('german'), flag: '🇩🇪' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`bg-gray-900/70 border-blue-500/30 text-white hover:bg-blue-900/30 rounded-lg shadow-md ${isMobile ? 'scale-75' : ''}`}
        >
          <Globe className="mr-1 h-4 w-4 text-blue-400" />
          {isMobile ? (
            ''
          ) : (
            <span>{languages.find(lang => lang.code === language)?.flag} {t('language')}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-gray-900/95 border-blue-500/30 text-white z-50"
        align="start"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`hover:bg-blue-900/30 cursor-pointer ${language === lang.code ? 'bg-blue-900/20' : ''}`}
            onClick={() => changeLanguage(lang.code)}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
