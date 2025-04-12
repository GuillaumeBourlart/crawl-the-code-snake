
import { useState, useEffect } from 'react';
import { useSkins } from '@/hooks/use-skins';
import { GameSkin } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import SkinPreview from './SkinPreview';
import { useAuth } from '@/hooks/use-auth';
import { Lock, CheckCircle2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface SkinSelectorProps {
  onSelectSkin?: (skinId: number) => void;
  onPurchase?: (skin: GameSkin) => void;
  showPreview?: boolean;
  previewPattern?: 'circular' | 'snake';
  simpleMode?: boolean; // Add simple mode for just showing names in a list
}

const SkinSelector = ({ 
  onSelectSkin, 
  onPurchase,
  showPreview = true,
  previewPattern = 'circular',
  simpleMode = false
}: SkinSelectorProps) => {
  const { 
    allSkins, 
    selectedSkinId, 
    setSelectedSkin,
    loading: skinsLoading,
    ownedSkinIds,
    getUnifiedSkinsList
  } = useSkins();
  
  const { user } = useAuth();
  const [hoveredSkin, setHoveredSkin] = useState<GameSkin | null>(null);
  const [displaySkins, setDisplaySkins] = useState<GameSkin[]>([]);
  
  // Use the unified list of skins from the hook
  useEffect(() => {
    if (!allSkins?.length) return;
    
    const unifiedSkins = getUnifiedSkinsList();
    console.log("SkinSelector: Using unified skins list", {
      total: unifiedSkins.length
    });
    
    setDisplaySkins(unifiedSkins);
  }, [allSkins, getUnifiedSkinsList]);

  // Log debug info when specific dependencies change
  useEffect(() => {
    console.log("SkinSelector: Update", { 
      displaySkins: displaySkins.length,
      selectedSkinId,
      allSkins: allSkins?.length || 0,
      ownedSkinIds: ownedSkinIds
    });
  }, [displaySkins.length, selectedSkinId, allSkins?.length, ownedSkinIds?.length]);

  const handleSkinSelect = (skinId: number) => {
    console.log("SkinSelector: selecting skin", skinId);
    
    // First set the selected skin in the hook - this will deselect any previously selected skin
    setSelectedSkin(skinId);
    
    // Then call the onSelectSkin callback if provided
    if (onSelectSkin) {
      onSelectSkin(skinId);
    }
  };

  const handlePurchase = (skin: GameSkin, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the skin when clicking the buy button
    console.log("SkinSelector: Buy button clicked for skin", skin.id, skin.name);
    
    if (!user) {
      console.log("SkinSelector: User not logged in, showing toast");
      toast.error("Veuillez vous connecter pour acheter des skins");
      return;
    }
    
    console.log("SkinSelector: Calling onPurchase callback", !!onPurchase);
    if (onPurchase) {
      onPurchase(skin);
    } else {
      console.warn("SkinSelector: No onPurchase callback provided");
    }
  };

  if (skinsLoading) {
    return (
      <div className="w-full flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (simpleMode) {
    return (
      <div className="w-full">
        <div className="flex flex-col space-y-2">
          {displaySkins.map(skin => {
            const isSelected = skin.id === selectedSkinId;
            const isOwned = !skin.is_paid || ownedSkinIds?.includes(skin.id);
            // Un skin est achetable uniquement s'il est payant ET que l'utilisateur ne le possède pas
            const isPurchasable = !isOwned && skin.is_paid;
            
            return (
              <Button
                key={skin.id}
                variant={isSelected ? "default" : "outline"}
                className={`text-sm justify-start ${
                  isSelected 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-gray-800/70 hover:bg-gray-700/70'
                }`}
                onClick={() => isOwned ? handleSkinSelect(skin.id) : null}
                disabled={!isOwned}
              >
                {isSelected && <CheckCircle2 className="h-4 w-4 mr-2 text-white" />}
                {isPurchasable && <Lock className="h-4 w-4 mr-2 text-gray-400" />}
                {skin.name}
                {skin.is_paid && (
                  <span className="ml-auto text-xs text-indigo-300 font-semibold">
                    {isOwned ? 'Purchased' : `${skin.price} €`}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  if (displaySkins.length === 0) {
    return (
      <div className="w-full text-center py-6 text-gray-400">
        Aucun skin disponible pour le moment
      </div>
    );
  }

  // Unified grid display with no sections or separations
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {displaySkins.map(skin => {
          const isSelected = skin.id === selectedSkinId;
          const isOwned = !skin.is_paid || ownedSkinIds?.includes(skin.id);
          
          // For free skins, they're always selectable
          // For paid skins, they're only selectable if owned
          const isSelectable = isOwned;
          
          // A skin is purchasable if it's paid and not owned
          const isPurchasable = skin.is_paid && !isOwned;
          
          return (
            <div
              key={skin.id}
              className={`relative rounded-lg overflow-hidden transition-all duration-200 p-3 ${
                isSelectable ? 'cursor-pointer' : 'cursor-default'
              } ${
                isSelected 
                  ? 'bg-indigo-500/20 ring-2 ring-indigo-500' 
                  : 'hover:bg-gray-800/30'
              }`}
              onClick={() => {
                console.log("Skin click:", {
                  skinId: skin.id,
                  isSelectable,
                  isOwned,
                  isPaid: skin.is_paid,
                  currentSelectedSkinId: selectedSkinId
                });
                
                if (isSelectable) {
                  handleSkinSelect(skin.id);
                }
              }}
              onMouseEnter={() => setHoveredSkin(skin)}
              onMouseLeave={() => setHoveredSkin(null)}
            >
              <div className="flex flex-col items-center">
                {showPreview && (
                  <div className="mb-3 flex justify-center items-center py-2 relative">
                    <div className="flex justify-center items-center">
                      <SkinPreview 
                        skin={skin} 
                        size="small" 
                        pattern={previewPattern}
                        // Always animate regardless of hover state
                        animate={true}
                      />
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-0.5">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    {/* Show lock icon for paid, unowned skins - no blurring */}
                    {isPurchasable && (
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                )}
                
                <h3 className="text-sm font-medium text-gray-200 truncate w-full text-center mt-1">
                  {skin.name}
                </h3>
                
                {skin.is_paid && (
                  <div className="text-xs text-indigo-300 font-semibold mt-1">
                    {isOwned ? 'Purchased' : `${skin.price} €`}
                  </div>
                )}
                
                {/* Show shop icon for purchasable skins */}
                {isPurchasable && (
                  <div className="mt-2 w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs bg-indigo-950/50 hover:bg-indigo-900/50 border-indigo-800"
                      onClick={(e) => handlePurchase(skin, e)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Acheter
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkinSelector;
