
import React from 'react';
import { Skin } from '@/hooks/use-skins';
import { Check } from 'lucide-react';

interface SkinSelectionProps {
  skins: Skin[];
  selectedSkinId: number | null;
  onSelectSkin: (skinId: number) => void;
  isLoading: boolean;
}

const SkinSelection: React.FC<SkinSelectionProps> = ({
  skins,
  selectedSkinId,
  onSelectSkin,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-200 mb-3">Choisissez votre skin</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {skins.map((skin) => {
          const colors = skin.data.colors || ['#FFFFFF'];
          const isSelected = selectedSkinId === skin.id;
          
          return (
            <div
              key={skin.id}
              onClick={() => onSelectSkin(skin.id)}
              className={`
                relative cursor-pointer transition-all duration-200 
                rounded-lg overflow-hidden shadow-lg
                ${isSelected ? 'ring-4 ring-indigo-500 scale-105' : 'ring-2 ring-gray-700 hover:ring-indigo-400'}
              `}
            >
              <div 
                className="w-full aspect-square flex flex-col items-center justify-center" 
                style={{
                  background: `linear-gradient(135deg, ${colors.join(', ')})`
                }}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <div className="bg-gray-800 p-2 text-center">
                <p className="text-sm font-medium text-white truncate">{skin.name}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkinSelection;
