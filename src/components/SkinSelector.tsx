import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSkins } from '@/hooks/use-skins';
import { GameSkin } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import SkinPreview from './SkinPreview';
import { useAuth } from '@/hooks/use-auth';
import { Lock, CheckCircle2, ShoppingCart, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import PurchaseConfirmationDialog from './PurchaseConfirmationDialog';
import { eventBus, EVENTS } from '@/lib/event-bus';

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
    ownedSkinIds,
    getUnifiedSkinsList,
    loading: skinsLoading,
    refresh: refreshSkins
  } = useSkins();
  
  const { user } = useAuth();
  const [hoveredSkin, setHoveredSkin] = useState<GameSkin | null>(null);
  const [displaySkins, setDisplaySkins] = useState<GameSkin[]>([]);
  const [purchaseConfirmationSkin, setPurchaseConfirmationSkin] = useState<GameSkin | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const unifiedSkinsList = useMemo(() => {
    if (!allSkins?.length) return [];
    return getUnifiedSkinsList();
  }, [allSkins, getUnifiedSkinsList]);
  
  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      console.log("SkinSelector: Manually refreshing skins...");
      await refreshSkins();
      toast.success("Les skins ont été actualisés");
    } catch (error) {
      console.error("Error manually refreshing skins:", error);
      toast.error("Impossible d'actualiser les skins");
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSkins, isRefreshing]);
  
  useEffect(() => {
    // Set up event listeners for skin loading events
    const skinLoadingSubscription = eventBus.subscribe(EVENTS.SKINS_LOADING, () => {
      console.log("SkinSelector: SKINS_LOADING event received");
    });
    
    const skinLoadedSubscription = eventBus.subscribe(EVENTS.SKINS_LOADED, (data) => {
      console.log("SkinSelector: SKINS_LOADED event received", data);
    });
    
    const skinErrorSubscription = eventBus.subscribe(EVENTS.SKINS_ERROR, (data) => {
      console.error("SkinSelector: SKINS_ERROR event received", data);
    });
    
    return () => {
      skinLoadingSubscription.unsubscribe();
      skinLoadedSubscription.unsubscribe();
      skinErrorSubscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (unifiedSkinsList.length > 0) {
      console.log("SkinSelector: Using unified skins list", {
        total: unifiedSkinsList.length
      });
      
      setDisplaySkins(prev => {
        if (JSON.stringify(prev) === JSON.stringify(unifiedSkinsList)) {
          return prev;
        }
        return unifiedSkinsList;
      });
    }
  }, [unifiedSkinsList]);

  useEffect(() => {
    console.log("SkinSelector: Update", { 
      displaySkins: displaySkins.length,
      selectedSkinId,
      allSkins: allSkins?.length || 0,
      ownedSkinIds: ownedSkinIds?.length || 0
    });
  }, [displaySkins.length, selectedSkinId, allSkins?.length, ownedSkinIds?.length]);

  const handleSkinSelect = async (skinId: number) => {
    try {
      console.log("SkinSelector: selecting skin", skinId);
      
      const success = await setSelectedSkin(skinId);
      
      if (success && onSelectSkin) {
        console.log("SkinSelector: selection successful, calling onSelectSkin");
        onSelectSkin(skinId);
      }
    } catch (error) {
      console.error("Error in handleSkinSelect:", error);
      toast.error("Impossible de sélectionner ce skin");
    }
  };

  const handlePurchaseRequest = (skin: GameSkin, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("SkinSelector: Buy button clicked for skin", skin.id, skin.name);
    
    if (!user) {
      console.log("SkinSelector: User not logged in, showing toast");
      toast.error("Veuillez vous connecter pour acheter des skins");
      return;
    }
    
    setPurchaseConfirmationSkin(skin);
  };
  
  const handleConfirmPurchase = (skin: GameSkin) => {
    console.log("SkinSelector: Purchase confirmed for skin", skin.id, skin.name);
    setPurchaseConfirmationSkin(null);
    
    console.log("SkinSelector: Calling onPurchase callback", !!onPurchase);
    if (onPurchase) {
      onPurchase(skin);
    } else {
      console.warn("SkinSelector: No onPurchase callback provided");
    }
  };

  const handleCancelPurchase = () => {
    console.log("SkinSelector: Purchase cancelled");
    setPurchaseConfirmationSkin(null);
  };

  if (skinsLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500"></div>
        <p className="text-sm text-gray-400">Chargement des skins...</p>
        {skinsLoading && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="mt-4 bg-gray-800/50 hover:bg-gray-700/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        )}
      </div>
    );
  }

  if (simpleMode) {
    return (
      <div className="w-full">
        <div className="flex justify-end mb-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-gray-800/50 hover:bg-gray-700/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
        <div className="flex flex-col space-y-2">
          {displaySkins.map(skin => {
            const isSelected = skin.id === selectedSkinId;
            const isOwned = !skin.is_paid || ownedSkinIds?.includes(skin.id);
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
      <div className="w-full">
        <div className="flex justify-end mb-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-gray-800/50 hover:bg-gray-700/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
        <div className="w-full text-center py-6 text-gray-400">
          Aucun skin disponible pour le moment
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="bg-gray-800/50 hover:bg-gray-700/50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {displaySkins.map(skin => {
          const isSelected = skin.id === selectedSkinId;
          const isOwned = !skin.is_paid || ownedSkinIds?.includes(skin.id);
          
          const isSelectable = isOwned;
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
              {showPreview && (
                <div className="mb-3 flex justify-center items-center py-2 relative">
                  <div className="flex justify-center items-center">
                    <SkinPreview 
                      skin={skin} 
                      size="small" 
                      pattern={previewPattern}
                      animate={true}
                    />
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-0.5">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
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
              
              {isPurchasable && (
                <div className="mt-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs bg-indigo-950/50 hover:bg-indigo-900/50 border-indigo-800"
                    onClick={(e) => handlePurchaseRequest(skin, e)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Acheter
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <PurchaseConfirmationDialog
        skin={purchaseConfirmationSkin}
        isOpen={!!purchaseConfirmationSkin}
        onClose={handleCancelPurchase}
        onConfirm={handleConfirmPurchase}
      />
    </div>
  );
};

export default SkinSelector;
