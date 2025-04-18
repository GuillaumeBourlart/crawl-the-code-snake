
import { Medal } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface PlayerScore {
  id: string;
  score: number;
  color: string;
  pseudo?: string;
}

interface LeaderboardPanelProps {
  roomLeaderboard: PlayerScore[];
  currentPlayerId: string | null;
}

const LeaderboardPanel = ({
  roomLeaderboard,
  currentPlayerId
}: LeaderboardPanelProps) => {
  const getMedalIcon = (position: number) => {
    if (position === 0) return <span className="text-yellow-400">🥇</span>;
    if (position === 1) return <span className="text-gray-400">🥈</span>;
    if (position === 2) return <span className="text-amber-700">🥉</span>;
    return null;
  };

  return (
    <div className="absolute top-16 right-4 z-10 w-40 sm:w-52 transition-all duration-300 ease-in-out">
      <div className="bg-transparent border border-gray-700/20 text-white shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableBody>
            {roomLeaderboard.length > 0 ? (
              roomLeaderboard.map((player, index) => (
                <TableRow 
                  key={player.id}
                  className={`border-gray-700/20 ${player.id === currentPlayerId ? "text-green-400" : ""}`}
                >
                  <TableCell className="px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium w-6 sm:w-8 bg-transparent">
                    {getMedalIcon(index) || index + 1}
                  </TableCell>
                  <TableCell className="px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs flex items-center bg-transparent">
                    <span 
                      className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full mr-1 sm:mr-1.5" 
                      style={{ backgroundColor: player.color }}
                    />
                    {player.id === currentPlayerId ? (
                      <span className="font-semibold">Vous</span>
                    ) : (
                      player.pseudo || `J${player.id.substring(0, 3)}`
                    )}
                  </TableCell>
                  <TableCell className="text-right px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-transparent">
                    {player.score}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-[10px] sm:text-xs py-2 text-gray-400 bg-transparent">
                  Aucun joueur
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LeaderboardPanel;
