
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

interface PlayerScoreProps {
  playerId: string | null;
  players: Record<string, {
    id?: string;
    queue?: Array<{ x: number; y: number }>;
    itemEatenCount?: number;
    pseudo?: string;
  }>;
}

const PlayerScore = ({ playerId, players }: PlayerScoreProps) => {
  const [score, setScore] = useState(0);
  
  useEffect(() => {
    if (!playerId || !players[playerId]) return;
    
    const player = players[playerId];
    const currentScore = player.itemEatenCount || 0;
    setScore(currentScore);
  }, [playerId, players]);
  
  if (!playerId || !players[playerId]) return null;
  
  return (
    <div className="absolute top-4 left-4 z-20 flex items-center bg-gray-900/80 backdrop-blur-sm border border-indigo-500/30 text-white rounded-lg px-3 py-2 shadow-xl animate-fade-in">
      <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
      <div className="flex flex-col">
        <div className="text-xs text-gray-300">Votre score</div>
        <div className="text-lg font-bold">{score}</div>
      </div>
    </div>
  );
};

export default PlayerScore;
