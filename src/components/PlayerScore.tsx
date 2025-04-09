
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

interface PlayerScore {
  id: string;
  score: number;
  color: string;
  pseudo?: string;
}

interface PlayerScoreProps {
  playerId: string | null;
  players: Record<string, {
    id?: string;
    score?: number;
    queue?: Array<{ x: number; y: number }>;
    itemEatenCount?: number;
    pseudo?: string;
  }>;
  roomLeaderboard?: PlayerScore[];
}

const PlayerScore = ({ playerId, players, roomLeaderboard = [] }: PlayerScoreProps) => {
  const [score, setScore] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  
  useEffect(() => {
    if (!playerId || !players[playerId]) return;
    
    const player = players[playerId];
    const currentScore = player.itemEatenCount || 0;
    setScore(currentScore);

    // Calculate player rank from leaderboard
    if (roomLeaderboard.length > 0) {
      const playerIndex = roomLeaderboard.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        setRank(playerIndex + 1);
      } else {
        setRank(null);
      }
    } else {
      setRank(null);
    }
  }, [playerId, players, roomLeaderboard]);
  
  if (!playerId || !players[playerId]) return null;
  
  return (
    <div className="absolute top-4 left-4 z-20 flex items-center bg-gray-900/80 border border-indigo-500/30 text-white rounded-lg px-3 py-2 shadow-xl">
      <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
      <div className="flex flex-col">
        <div className="text-xs text-gray-300">Votre score</div>
        <div className="text-lg font-bold">{score}</div>
        {rank !== null && (
          <div className="text-xs text-indigo-300 mt-0.5">
            Rang #{rank} sur {roomLeaderboard.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerScore;
