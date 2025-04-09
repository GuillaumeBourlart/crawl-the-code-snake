
import { useState } from "react";
import { Trophy, Users, Medal, AlertCircle, WifiOff, Loader } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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
  isGlobalLeaderboardLoading?: boolean;
  globalLeaderboardError?: Error | null;
  usesFallbackData?: boolean;
}

const LeaderboardPanel = ({
  roomLeaderboard,
  globalLeaderboard,
  currentPlayerId,
  isVisible,
  isGlobalLeaderboardLoading = false,
  globalLeaderboardError = null,
  usesFallbackData = false
}: LeaderboardPanelProps) => {
  const [activeTab, setActiveTab] = useState<string>("room");

  if (!isVisible) return null;

  const getMedalIcon = (position: number) => {
    if (position === 0) return <span className="text-yellow-400">🥇</span>;
    if (position === 1) return <span className="text-gray-400">🥈</span>;
    if (position === 2) return <span className="text-amber-700">🥉</span>;
    return null;
  };

  return (
    <div className="absolute top-16 right-4 z-20 w-80 transition-all duration-300 ease-in-out">
      <Card className="bg-gray-900/85 border-gray-700 backdrop-blur-md text-white shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="px-5 py-3 border-b border-gray-800 bg-gray-800/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center font-bold">
              <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
              Leaderboards
            </CardTitle>
            <CardDescription className="text-gray-300 text-xs">
              Top 10 joueurs
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <Tabs defaultValue="room" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-3 bg-gray-800/70 rounded-lg p-1">
              <TabsTrigger value="room" className="flex items-center data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-1.5" />
                <span>Partie</span>
              </TabsTrigger>
              <TabsTrigger value="global" className="flex items-center data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <Medal className="h-4 w-4 mr-1.5" />
                <span>Global</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="room" className="mt-0 p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 bg-gray-800/30">
                    <TableHead className="w-12 px-2 py-2 text-xs font-medium">#</TableHead>
                    <TableHead className="px-2 py-2 text-xs font-medium">Joueur</TableHead>
                    <TableHead className="text-right px-2 py-2 text-xs font-medium">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomLeaderboard.length > 0 ? (
                    roomLeaderboard.map((player, index) => (
                      <TableRow 
                        key={player.id}
                        className={`border-gray-700/50 transition-colors ${player.id === currentPlayerId ? "bg-green-900/40" : "hover:bg-gray-800/30"}`}
                      >
                        <TableCell className="px-2 py-2 text-xs font-medium">
                          {getMedalIcon(index) || index + 1}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-xs flex items-center">
                          <span 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: player.color }}
                          />
                          {player.id === currentPlayerId ? (
                            <span className="font-semibold">Vous</span>
                          ) : (
                            player.pseudo || `Joueur ${player.id.substring(0, 4)}`
                          )}
                          {player.id === currentPlayerId && (
                            <Badge className="ml-2 bg-green-900 text-green-100 text-[10px]">You</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-2 py-2 text-xs font-medium">
                          {player.score}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-6 text-gray-400">
                        Aucun joueur
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="global" className="mt-0 p-0">
              {usesFallbackData && (
                <Alert variant="destructive" className="mb-2 py-2 bg-amber-950/50 border-amber-800 text-amber-200 rounded-lg">
                  <AlertDescription className="text-xs flex items-center">
                    <WifiOff className="h-3 w-3 mr-1.5" />
                    Données hors ligne (fallback)
                  </AlertDescription>
                </Alert>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 bg-gray-800/30">
                    <TableHead className="w-12 px-2 py-2 text-xs font-medium">#</TableHead>
                    <TableHead className="px-2 py-2 text-xs font-medium">Joueur</TableHead>
                    <TableHead className="text-right px-2 py-2 text-xs font-medium">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isGlobalLeaderboardLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-6 text-gray-300">
                        <div className="flex flex-col items-center justify-center">
                          <Loader className="h-5 w-5 animate-spin mb-2 text-indigo-400" />
                          <span>Chargement...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : globalLeaderboardError && !usesFallbackData ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-4 text-red-300">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-5 w-5 mb-2 text-red-400" />
                          <span className="font-medium">Erreur de chargement</span>
                          <span className="text-xs text-red-300/70 mt-1">
                            {globalLeaderboardError.message.substring(0, 35)}
                            {globalLeaderboardError.message.length > 35 ? '...' : ''}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : globalLeaderboard.length > 0 ? (
                    globalLeaderboard.map((player, index) => (
                      <TableRow 
                        key={player.id}
                        className={`border-gray-700/50 transition-colors ${player.id === currentPlayerId ? "bg-green-900/40" : "hover:bg-gray-800/30"}`}
                      >
                        <TableCell className="px-2 py-2 text-xs font-medium">
                          {getMedalIcon(index) || index + 1}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-xs">
                          {player.id === currentPlayerId ? (
                            <span className="font-semibold">Vous</span>
                          ) : (
                            player.pseudo || `Joueur ${player.id.substring(0, 4)}`
                          )}
                          {player.id === currentPlayerId && (
                            <Badge className="ml-2 bg-green-900 text-green-100 text-[10px]">You</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-2 py-2 text-xs font-medium">
                          {player.score}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-6 text-gray-400">
                        Aucun classement global
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
