import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GameCanvas from "@/components/GameCanvas";
import { io } from "socket.io-client";
import MobileControls from "@/components/MobileControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import GameOverDialog from "@/components/GameOverDialog";
import { Trophy, User, ArrowRight, Settings, Palette, LogOut, Play } from "lucide-react";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import { useGlobalLeaderboard } from "@/hooks/use-leaderboard";
import PlayerScore from "@/components/PlayerScore";
import { useAuth } from "@/hooks/use-auth";
import { useSkins } from "@/hooks/use-skins";
import SkinPreview from "@/components/SkinPreview";
import { Link } from "react-router-dom";
import AuthButtons from "@/components/AuthButtons";
import ZigzagTitle from "@/components/ZigzagTitle";
import AnimatedArrow from "@/components/AnimatedArrow";

const SOCKET_SERVER_URL = "https://codecrawl-production.up.railway.app";

interface ServerPlayer {
  id?: string;
  x: number;
  y: number;
  length?: number;
  color?: string;
  direction?: { x: number; y: number };
  queue?: Array<{ x: number; y: number; color?: string }>;
  boosting?: boolean;
  itemEatenCount?: number;
  pseudo?: string;
  spectator?: boolean;
  skin_id?: number | null;
}

interface GameItem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  radius?: number;
}

interface ServerGameState {
  players: Record<string, ServerPlayer>;
  items?: Record<string, GameItem> | GameItem[];
  worldSize?: { width: number; height: number };
}

interface PlayerLeaderboardEntry {
  id: string;
  score: number;
  color: string;
  pseudo?: string;
}

const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 2000;

const MIN_ITEM_RADIUS = 4;
const MAX_ITEM_RADIUS = 10;
const DEFAULT_ITEM_EATEN_COUNT = 18;

const Index = () => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ServerGameState>({
    players: {},
    items: {},
    worldSize: { width: 4000, height: 4000 }
  });
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);
  const [roomLeaderboard, setRoomLeaderboard] = useState<PlayerLeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [username, setUsername] = useState<string>("");
  const [isSpectator, setIsSpectator] = useState(false);
  const [availableSkins, setAvailableSkins] = useState<any[]>([]);
  const [skinLoadAttempted, setSkinLoadAttempted] = useState(false);

  const { leaderboard: globalLeaderboard, isLoading: isGlobalLeaderboardLoading, error: globalLeaderboardError, usesFallback } = useGlobalLeaderboard(SOCKET_SERVER_URL);
  
  const isMobile = useIsMobile();
  const moveThrottleRef = useRef(false);
  const lastDirectionRef = useRef({ x: 0, y: 0 });
  const directionIntervalRef = useRef<number | null>(null);
  
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { 
    selectedSkin, 
    selectedSkinId, 
    availableSkins: userSkins, 
    loading: skinsLoading, 
    setSelectedSkin,
    refresh: refreshSkins
  } = useSkins();
  
  useEffect(() => {
    if (!skinLoadAttempted) {
      console.log("Initial skins refresh");
      refreshSkins();
      setSkinLoadAttempted(true);
    }
  }, [refreshSkins, skinLoadAttempted]);
  
  useEffect(() => {
    if (userSkins && userSkins.length > 0) {
      console.log("Setting available skins from userSkins:", userSkins.length);
      setAvailableSkins(userSkins);
    }
  }, [userSkins]);
  
  useEffect(() => {
    if (profile && profile.pseudo) {
      setUsername(profile.pseudo);
    }
  }, [profile]);
  
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socket) {
        socket.emit("clean_disconnect");
        socket.disconnect();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (socket) socket.disconnect();
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (directionIntervalRef.current) window.clearInterval(directionIntervalRef.current);
    };
  }, [socket]);

  useEffect(() => {
    if (gameStarted && socket && playerId && !isSpectator) {
      directionIntervalRef.current = window.setInterval(() => {
        if (lastDirectionRef.current.x !== 0 || lastDirectionRef.current.y !== 0) {
          socket.emit("changeDirection", { direction: lastDirectionRef.current });
        }
      }, 50);

      return () => {
        if (directionIntervalRef.current) {
          window.clearInterval(directionIntervalRef.current);
          directionIntervalRef.current = null;
        }
      };
    }
    
    return () => {
      if (directionIntervalRef.current) {
        window.clearInterval(directionIntervalRef.current);
        directionIntervalRef.current = null;
      }
    };
  }, [gameStarted, socket, playerId, isSpectator]);
  
  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts < MAX_RECONNECTION_ATTEMPTS) {
      setReconnectAttempts(prev => prev + 1);
      toast.info(`Tentative de reconnexion (${reconnectAttempts + 1}/${MAX_RECONNECTION_ATTEMPTS})...`);
      reconnectTimerRef.current = window.setTimeout(() => {
        handlePlay();
      }, RECONNECTION_DELAY);
    } else {
      toast.error("Impossible de se reconnecter au serveur après plusieurs tentatives");
      setConnecting(false);
      setReconnectAttempts(0);
    }
  }, [reconnectAttempts]);
  
  const generateRandomItems = (count: number, worldSize: { width: number; height: number }) => {
    const items: Record<string, GameItem> = {};
    const itemColors = ['#FF5733', '#33FF57', '#3357FF', '#33A8FF', '#33FFF5', '#FFD133', '#8F33FF'];
    
    const randomItemRadius = () => Math.floor(Math.random() * (MAX_ITEM_RADIUS - MIN_ITEM_RADIUS + 1)) + MIN_ITEM_RADIUS;
    
    for (let i = 0; i < count; i++) {
      const id = `item-${i}`;
      items[id] = {
        id,
        x: Math.random() * worldSize.width,
        y: Math.random() * worldSize.height,
        value: Math.floor(Math.random() * 5) + 1,
        color: itemColors[Math.floor(Math.random() * itemColors.length)],
        radius: randomItemRadius()
      };
    }
    return items;
  };
  
  const handlePlay = () => {
    if (!username.trim()) {
      toast.error("Veuillez entrer un pseudo avant de jouer");
      return;
    }
    
    if (user && profile && username !== profile.pseudo) {
      updateProfile({ pseudo: username });
    }
    
    if (!selectedSkinId) {
      toast.error("Veuillez sélectionner un skin avant de jouer");
      return;
    }
    
    console.log("Starting game with skin ID:", selectedSkinId);
    
    setConnecting(true);
    setShowGameOverDialog(false);
    setIsSpectator(false);
    
    if (socket) {
      socket.emit("clean_disconnect");
      socket.disconnect();
    }
    
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      upgrade: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setConnected(true);
      setConnecting(false);
      setReconnectAttempts(0);
      toast.success("Connecté au serveur");
    });
    
    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnecting(false);
      toast.error("Erreur de connexion au serveur");
      attemptReconnect();
    });
    
    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server. Reason:", reason);
      setConnected(false);
      setGameStarted(false);
      setRoomId(null);
      
      if (reason === "io server disconnect") {
        toast.error("Déconnecté par le serveur");
      } else if (reason === "transport close") {
        toast.error("Connexion perdue");
        attemptReconnect();
      } else if (reason === "ping timeout") {
        toast.error("Délai d'attente serveur dépassé");
        attemptReconnect();
      } else {
        toast.error("Déconnecté du serveur");
      }
    });
    
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Erreur de socket: " + error);
      
      if (!connected) {
        attemptReconnect();
      }
    });
    
    newSocket.on("joined_room", (data: { roomId: string }) => {
      console.log("Joined room:", data.roomId);
      setRoomId(data.roomId);
      setPlayerId(newSocket.id);
      setGameStarted(true);
      
      console.log("Sending player info to server with skin:", selectedSkinId);
      newSocket.emit("setPlayerInfo", { 
        pseudo: username,
        skin_id: selectedSkinId
      });
      
      const worldSize = { width: 4000, height: 4000 };
      const randomItems = generateRandomItems(50, worldSize);
      
      setGameState(prevState => ({
        ...prevState,
        items: randomItems,
        worldSize
      }));
      
      toast.success("Vous avez rejoint la partie");
    });
    
    newSocket.on("update_room_leaderboard", (leaderboard: PlayerLeaderboardEntry[]) => {
      console.log("Room leaderboard update:", leaderboard);
      setRoomLeaderboard(leaderboard);
    });
    
    newSocket.on("player_eliminated", () => {
      console.log("You were eliminated!");
      toast.error("Vous avez été éliminé!");
      setIsSpectator(true);
      setShowGameOverDialog(true);
    });
    
    newSocket.on("set_spectator", (isSpectator: boolean) => {
      console.log("Set spectator mode:", isSpectator);
      setIsSpectator(isSpectator);
    });
    
    newSocket.on("player_grew", (data: { growth: number }) => {
      console.log("You ate another player! Growing by:", data.growth);
      toast.success(`Vous avez mangé un joueur! +${data.growth} points`);
      if (playerId) {
        setGameState(prevState => {
          const currentPlayer = prevState.players[playerId];
          if (!currentPlayer) return prevState;
          
          const newItemEatenCount = (currentPlayer.itemEatenCount || DEFAULT_ITEM_EATEN_COUNT) + data.growth;
          
          const targetQueueLength = Math.max(6, Math.floor(newItemEatenCount / 3));
          const currentQueueLength = currentPlayer.queue?.length || 0;
          const segmentsToAdd = targetQueueLength - currentQueueLength;
          
          let newQueue = [...(currentPlayer.queue || [])];
          
          for (let i = 0; i < segmentsToAdd; i++) {
            newQueue.push({ x: currentPlayer.x, y: currentPlayer.y });
          }
          
          return {
            ...prevState,
            players: {
              ...prevState.players,
              [playerId]: {
                ...currentPlayer,
                queue: newQueue,
                itemEatenCount: newItemEatenCount
              }
            }
          };
        });
      }
    });
    
    newSocket.on("no_room_available", () => {
      toast.error("Aucune salle disponible");
      setConnecting(false);
      newSocket.disconnect();
    });
    
    newSocket.on("ping_request", () => {
      newSocket.emit("pong_response");
    });
    
    newSocket.on("update_players", (players: Record<string, ServerPlayer>) => {
      console.log("Players update:", players);
      
      const processedPlayers = Object.entries(players).reduce((acc, [id, player]) => {
        const processedQueue = player.queue?.map(segment => {
          return typeof segment === 'object' ? 
            { ...segment, color: segment.color || player.color || '#FFFFFF' } : 
            { x: 0, y: 0, color: player.color || '#FFFFFF' };
        }) || [];
        
        return {
          ...acc,
          [id]: { 
            ...player, 
            queue: processedQueue
          }
        };
      }, {});
      
      setGameState(prevState => ({
        ...prevState,
        players: processedPlayers
      }));
    });
    
    newSocket.on("update_items", (items: Record<string, GameItem> | GameItem[]) => {
      console.log("Items update:", items);
      const itemsObject = Array.isArray(items)
        ? items.reduce((acc, item) => ({ ...acc, [item.id]: item }), {})
        : items;
      setGameState(prevState => ({
        ...prevState,
        items: itemsObject
      }));
    });
    
    newSocket.emit("join_room");
    setSocket(newSocket);
  };
  
  const handleMove = (direction: { x: number; y: number }) => {
    lastDirectionRef.current = direction;
  };
  
  const handleBoostStart = () => {
    if (socket && gameStarted && !isSpectator) {
      socket.emit("boostStart");
    }
  };
  
  const handleBoostStop = () => {
    if (socket && gameStarted && !isSpectator) {
      socket.emit("boostStop");
    }
  };
  
  const handlePlayerCollision = (otherPlayerId: string) => {
    if (socket && gameStarted && playerId && !isSpectator) {
      const currentPlayer = gameState.players[playerId];
      const otherPlayer = gameState.players[otherPlayerId];
      if (!currentPlayer || !otherPlayer) return;
      const dx = currentPlayer.x - otherPlayer.x;
      const dy = currentPlayer.y - otherPlayer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const currentSize = 20 * (1 + ((currentPlayer.queue?.length || 0) * 0.1));
      const otherSize = 20 * (1 + ((otherPlayer.queue?.length || 0) * 0.1));
      if (distance < (currentSize + otherSize) / 2) {
        const currentQueueLength = currentPlayer.queue?.length || 0;
        const otherQueueLength = otherPlayer.queue?.length || 0;
        if (currentQueueLength <= otherQueueLength) {
          socket.emit("player_eliminated", { eliminatedBy: otherPlayerId });
          toast.error("Vous avez été éliminé!");
          setIsSpectator(true);
          setShowGameOverDialog(true);
        } else {
          socket.emit("eat_player", { eatenPlayer: otherPlayerId });
        }
      } else {
        socket.emit("player_eliminated", { eliminatedBy: otherPlayerId });
        toast.error("Vous avez été éliminé par la queue d'un autre joueur!");
        setIsSpectator(true);
        setShowGameOverDialog(true);
      }
    }
  };

  const handleQuitGame = () => {
    if (socket) {
      socket.emit("clean_disconnect");
      socket.disconnect();
    }
    setGameStarted(false);
    setShowGameOverDialog(false);
    setPlayerId(null);
    setRoomId(null);
    setIsSpectator(false);
  };

  const handleRetry = () => {
    if (socket) {
      socket.emit("clean_disconnect");
      socket.disconnect();
    }
    
    setShowGameOverDialog(false);
    setIsSpectator(false);
    handlePlay();
  };

  const handleJoystickMove = (direction: { x: number; y: number }) => {
    lastDirectionRef.current = direction;
  };

  const toggleLeaderboard = () => {
    setShowLeaderboard(prev => !prev);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const isLoading = authLoading || skinsLoading;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      {!gameStarted && (
        <div className="z-10 flex flex-col items-center justify-center p-8 rounded-2xl w-full max-w-md animate-fade-in">
          <div className="flex items-center mb-6">
            <ZigzagTitle className="w-full" />
          </div>
          
          <div className="w-full max-w-sm mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <Input
                type="text"
                placeholder="Entrez votre pseudo"
                value={username}
                onChange={handleUsernameChange}
                className="text-white bg-gray-800/60 border-gray-700/70 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 py-6"
                maxLength={16}
                required
              />
            </div>
          </div>
          
          <div className="w-full mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-medium text-gray-300">Votre skin</h2>
            </div>
            
            <Link to="/skins" className="block bg-gray-800/40 rounded-full p-4 border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
              {isLoading ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
                </div>
              ) : (
                selectedSkin ? (
                  <div className="flex flex-col items-center">
                    <SkinPreview skin={selectedSkin} size="medium" animate={true} pattern="snake" />
                    <h3 className="mt-2 text-md font-medium">{selectedSkin.name}</h3>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <p className="text-gray-400">Aucun skin sélectionné</p>
                    <p className="text-xs text-indigo-400 mt-2">Cliquez pour en choisir un</p>
                  </div>
                )
              )}
            </Link>
          </div>
          
          <div className="flex flex-col w-full gap-3">
            <button
              className="relative w-full flex flex-col items-center justify-center mx-auto transition-all duration-300 h-48 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePlay}
              disabled={connecting || !username.trim() || !selectedSkinId || isLoading}
            >
              {connecting ? (
                <div className="p-5">
                  <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <AnimatedArrow className="w-full h-48" />
              )}
            </button>
            
            <div className="flex justify-center">
              <AuthButtons />
            </div>
          </div>
          
          {reconnectAttempts > 0 && (
            <p className="mt-4 text-amber-400 flex items-center">
              <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Tentative de reconnexion {reconnectAttempts}/{MAX_RECONNECTION_ATTEMPTS}
            </p>
          )}
        </div>
      )}
      
      {gameStarted && (
        <>
          <div className="absolute top-4 right-4 z-20 flex space-x-2">
            <Link to="/skins">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-900/70 border-indigo-500/30 text-white hover:bg-indigo-900/30 rounded-lg shadow-md"
              >
                <Palette className="mr-1 h-4 w-4 text-indigo-400" />
                Skins
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-900/70 border-red-500/30 text-white hover:bg-red-900/30 rounded-lg shadow-md"
              onClick={handleQuitGame}
            >
              <LogOut className="mr-1 h-4 w-4 text-red-400" />
              Quitter
            </Button>
          </div>
          
          {isSpectator && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-red-600/70 text-white rounded-lg shadow-md">
              Mode Spectateur
            </div>
          )}
          
          <PlayerScore 
            playerId={playerId} 
            players={gameState.players}
            roomLeaderboard={roomLeaderboard} 
          />
          
          <LeaderboardPanel 
            roomLeaderboard={roomLeaderboard}
            currentPlayerId={playerId}
          />
          
          <GameCanvas
            gameState={{
              ...gameState,
              players: gameState.players || {},
              items: gameState.items ? Object.values(gameState.items) : [],
              worldSize: gameState.worldSize || { width: 4000, height: 4000 }
            }}
            playerId={playerId}
            onMove={handleMove}
            onBoostStart={handleBoostStart}
            onBoostStop={handleBoostStop}
            onPlayerCollision={handlePlayerCollision}
            isSpectator={isSpectator}
          />
          
          {isMobile && !isSpectator && (
            <MobileControls 
              onMove={handleMove} 
              onBoostStart={handleBoostStart} 
              onBoostStop={handleBoostStop}
              onJoystickMove={handleJoystickMove}
            />
          )}
        </>
      )}

      <GameOverDialog 
        isOpen={showGameOverDialog}
        onClose={() => setShowGameOverDialog(false)}
        onRetry={handleRetry}
        onQuit={handleQuitGame}
        playerColor={playerId && gameState.players[playerId]?.color}
      />
    </div>
  );
};

export default Index;
