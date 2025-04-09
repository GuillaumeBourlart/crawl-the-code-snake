
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
    <div className="absolute top-4 left-4 z-20 flex items-center bg-gray-900/80 backdrop-blur-md border border-indigo-500/50 text-white rounded-lg px-3 py-2 shadow-xl animate-fade-in">
      <div className="relative">
        <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <div className="text-xs text-blue-300 font-medium">Votre score</div>
        <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">{score}</div>
      </div>
    </div>
  );
};

export default PlayerScore;
