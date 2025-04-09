
import { useState } from "react";
import { Trophy, Users, Medal } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlayerScore {
  id: string;
  score: number;
  color: string;
  pseudo?: string;
}

interface LeaderboardPanelProps {
  roomLeaderboard: PlayerScore[];
  globalLeaderboard: { id: string; score: number; pseudo?: string }[];
  currentPlayerId: string | null;
  isVisible: boolean;
}

const LeaderboardPanel = ({
  roomLeaderboard,
  globalLeaderboard,
  currentPlayerId,
  isVisible
}: LeaderboardPanelProps) => {
  const [activeTab, setActiveTab] = useState<string>("room");

  if (!isVisible) return null;

  return (
    <div className="absolute top-16 right-4 z-20 w-72 transition-all duration-300 ease-in-out">
      <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm text-white">
        <CardHeader className="px-4 py-3 space-y-1">
          <CardTitle className="text-lg flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            Leaderboards
          </CardTitle>
          <CardDescription className="text-gray-400 text-xs">
            Top 10 joueurs
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-1 pb-2">
          <Tabs defaultValue="room" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-2 bg-gray-800/60">
              <TabsTrigger value="room" className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>Partie</span>
              </TabsTrigger>
              <TabsTrigger value="global" className="flex items-center">
                <Medal className="h-4 w-4 mr-1" />
                <span>Global</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="room" className="mt-0 p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="w-10 px-2 py-1 text-xs">#</TableHead>
                    <TableHead className="px-2 py-1 text-xs">Joueur</TableHead>
                    <TableHead className="text-right px-2 py-1 text-xs">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomLeaderboard.length > 0 ? (
                    roomLeaderboard.map((player, index) => (
                      <TableRow 
                        key={player.id}
                        className={`border-gray-700 ${player.id === currentPlayerId ? "bg-green-900/30" : ""}`}
                      >
                        <TableCell className="px-2 py-1 text-xs font-medium">{index + 1}</TableCell>
                        <TableCell className="px-2 py-1 text-xs flex items-center">
                          <span 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: player.color }}
                          />
                          {player.id === currentPlayerId ? "Vous" : (player.pseudo || `Joueur ${player.id.substring(0, 4)}`)}
                        </TableCell>
                        <TableCell className="text-right px-2 py-1 text-xs">{player.score}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-2 text-gray-400">
                        Aucun joueur
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="global" className="mt-0 p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="w-10 px-2 py-1 text-xs">#</TableHead>
                    <TableHead className="px-2 py-1 text-xs">Joueur</TableHead>
                    <TableHead className="text-right px-2 py-1 text-xs">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalLeaderboard.length > 0 ? (
                    globalLeaderboard.map((player, index) => (
                      <TableRow 
                        key={player.id}
                        className={`border-gray-700 ${player.id === currentPlayerId ? "bg-green-900/30" : ""}`}
                      >
                        <TableCell className="px-2 py-1 text-xs font-medium">{index + 1}</TableCell>
                        <TableCell className="px-2 py-1 text-xs">
                          {player.id === currentPlayerId ? "Vous" : (player.pseudo || `Joueur ${player.id.substring(0, 4)}`)}
                        </TableCell>
                        <TableCell className="text-right px-2 py-1 text-xs">{player.score}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-2 text-gray-400">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPanel;
