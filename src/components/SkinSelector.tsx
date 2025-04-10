
import { useState, useEffect } from 'react';
import { useSkins } from '@/hooks/use-skins';
import { GameSkin } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import SkinPreview from './SkinPreview';
import { useAuth } from '@/hooks/use-auth';
import { Lock, CheckCircle2 } from 'lucide-react';

interface SkinSelectorProps {
  onSelectSkin?: (skinId: number) => void;
  showPurchasable?: boolean;
  onPurchase?: (skin: GameSkin) => void;
  showPreview?: boolean;
  previewPattern?: 'circular' | 'snake';
  simpleMode?: boolean; // Add simple mode for just showing names in a list
}

const SkinSelector = ({ 
  onSelectSkin, 
  showPurchasable = false,
  onPurchase,
  showPreview = true,
  previewPattern = 'circular',
  simpleMode = false
}: SkinSelectorProps) => {
  const { 
    availableSkins, 
    purchasableSkins, 
    selectedSkinId, 
    setSelectedSkin,
    loading: skinsLoading,
    allSkins,
    ownedSkinIds,
    freeSkins
  } = useSkins();
  const { user } = useAuth();
  const [hoveredSkin, setHoveredSkin] = useState<GameSkin | null>(null);
  const [displaySkins, setDisplaySkins] = useState<GameSkin[]>([]);
  
  // Determine which skins to display
  useEffect(() => {
    if (showPurchasable) {
      // For the boutique/store section - show all paid skins
      setDisplaySkins(allSkins?.filter(skin => skin.is_paid) || []);
    } else {
      // For the free skins section - show only free skins
      setDisplaySkins(freeSkins || []);
    }
  }, [freeSkins, allSkins, showPurchasable]);

  // Log some debug info when component mounts or dependencies change
  useEffect(() => {
    console.log("SkinSelector: Update", { 
      availableSkins: availableSkins?.length || 0,
      purchasableSkins: purchasableSkins?.length || 0,
      displaySkins: displaySkins.length,
      selectedSkinId,
      showPurchasable,
      allSkins: allSkins?.length || 0,
      ownedSkinIds: ownedSkinIds,
      freeSkins: freeSkins?.length || 0
    });
  }, [availableSkins, purchasableSkins, displaySkins.length, selectedSkinId, showPurchasable, allSkins, ownedSkinIds, freeSkins]);

  const handleSkinSelect = (skinId: number) => {
    console.log("SkinSelector: selecting skin", skinId);
    
    // First set the selected skin in the hook
    setSelectedSkin(skinId);
    
    // Then call the onSelectSkin callback if provided
    if (onSelectSkin) {
      onSelectSkin(skinId);
    }
  };

  const handlePurchase = (skin: GameSkin) => {
    if (onPurchase) {
      onPurchase(skin);
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
            const isOwned = ownedSkinIds?.includes(skin.id);
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
                onClick={() => handleSkinSelect(skin.id)}
                disabled={isPurchasable}
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

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {displaySkins.map(skin => {
          const isSelected = skin.id === selectedSkinId;
          const isOwned = ownedSkinIds?.includes(skin.id);
          
          // For free skins, they're always selectable
          // For paid skins, they're only selectable if owned
          const isSelectable = !skin.is_paid || isOwned;
          
          // A skin is purchasable if it's in the store section, paid, and not owned
          const isPurchasable = showPurchasable && skin.is_paid && !isOwned;
          
          return (
            <div
              key={skin.id}
              className={`relative rounded-lg overflow-hidden transition-all duration-200 p-3 ${
                isSelectable ? 'cursor-pointer' : 'cursor-default opacity-80'
              } ${
                isSelected 
                  ? 'bg-indigo-500/20 ring-2 ring-indigo-500' 
                  : 'hover:bg-gray-800/30'
              }`}
              onClick={() => {
                // Log more details to help debug the selection issue
                console.log("Skin click:", {
                  skinId: skin.id,
                  isSelectable,
                  isOwned,
                  isPaid: skin.is_paid
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
                  <div className="mb-3 relative">
                    <div className="flex justify-center items-center">
                      <SkinPreview 
                        skin={skin} 
                        size="small" 
                        animate={hoveredSkin?.id === skin.id}
                        pattern={previewPattern}
                      />
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-0.5">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    {/* Only show lock for skins that cannot be selected */}
                    {!isSelectable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                        <Lock className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                )}
                
                <h3 className="text-sm font-medium text-gray-200 truncate w-full text-center">
                  {skin.name}
                </h3>
                
                {skin.is_paid && (
                  <div className="text-xs text-indigo-300 font-semibold mt-1">
                    {isOwned ? 'Purchased' : `${skin.price} €`}
                  </div>
                )}
                
                {isPurchasable && user && (
                  <div className="mt-2 w-full">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs bg-indigo-950/50 hover:bg-indigo-900/50 border-indigo-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(skin);
                      }}
                    >
                      Buy
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
