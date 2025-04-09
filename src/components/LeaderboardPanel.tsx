
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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
              {usesFallbackData && (
                <Alert variant="destructive" className="mb-2 py-2 bg-amber-950/50 border-amber-800 text-amber-200">
                  <AlertDescription className="text-xs flex items-center">
                    <WifiOff className="h-3 w-3 mr-1" />
                    Données hors ligne (fallback)
                  </AlertDescription>
                </Alert>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="w-10 px-2 py-1 text-xs">#</TableHead>
                    <TableHead className="px-2 py-1 text-xs">Joueur</TableHead>
                    <TableHead className="text-right px-2 py-1 text-xs">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isGlobalLeaderboardLoading ? (
                    // Afficher un loader pendant le chargement
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-4 text-gray-400">
                        <div className="flex flex-col items-center justify-center">
                          <Loader className="h-4 w-4 animate-spin mb-1" />
                          <span>Chargement...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : globalLeaderboardError && !usesFallbackData ? (
                    // Afficher une erreur si la récupération a échoué et pas de fallback
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-2 text-red-400">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-4 w-4 mb-1 text-red-400" />
                          <span>Erreur de chargement</span>
                          <span className="text-xs text-red-300/70 mt-1">
                            {globalLeaderboardError.message.substring(0, 35)}
                            {globalLeaderboardError.message.length > 35 ? '...' : ''}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : globalLeaderboard.length > 0 ? (
                    // Afficher les données si elles sont disponibles
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
                    // Aucune donnée disponible
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-xs py-2 text-gray-400">
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
