
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
    <div className="absolute top-4 left-4 z-20 flex items-center bg-gray-900/70 backdrop-blur-xl border border-indigo-500/50 text-white rounded-lg px-3 py-2 shadow-2xl animate-fade-in">
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20 pointer-events-none" />
      <div className="relative bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-1.5 mr-3">
        <Trophy className="h-5 w-5 text-white drop-shadow-md" />
      </div>
      <div className="flex flex-col">
        <div className="text-xs text-gray-300">Votre score</div>
        <div className="text-lg font-bold bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">{score}</div>
      </div>
    </div>
  );
};

export default PlayerScore;
