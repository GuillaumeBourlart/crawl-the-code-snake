
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
import Footer from "@/components/Footer";

const SOCKET_SERVER_URL = "wss://grubz.io";

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
  // State and hooks
  const [pseudo, setPseudo] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<ServerGameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [deathReason, setDeathReason] = useState("");
  const [lastScore, setLastScore] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [roomLeaderboard, setRoomLeaderboard] = useState<PlayerLeaderboardEntry[]>([]);
  const socketRef = useRef<any>(null);
  const reconnectionAttemptsRef = useRef(0);
  const reconnectingRef = useRef(false);
  const movementRef = useRef({ up: false, down: false, left: false, right: false });
  const boosting = useRef(false);
  const isMobile = useIsMobile();
  const { data: globalLeaderboard = [] } = useGlobalLeaderboard();
  const { user, profile } = useAuth();
  const { selectedSkin } = useSkins();

  // Initialize socket connection
  useEffect(() => {
    if (!socketRef.current) {
      const socket = io(SOCKET_SERVER_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("Connected to server");
        reconnectingRef.current = false;
        reconnectionAttemptsRef.current = 0;
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from server");
        if (isPlaying) {
          setIsPlaying(false);
          toast.error("Déconnecté du serveur de jeu", {
            description: "Tentative de reconnexion en cours...",
          });
        }
        attemptReconnect();
      });

      socket.on("gameState", (state: ServerGameState) => {
        setGameState(state);
      });

      socket.on("playerJoined", (id: string) => {
        setPlayerId(id);
      });

      socket.on("leaderboard", (data: PlayerLeaderboardEntry[]) => {
        setRoomLeaderboard(data);
      });

      socket.on("gameOver", (data: { reason: string; score: number }) => {
        setIsPlaying(false);
        setGameOver(true);
        setDeathReason(data.reason);
        setLastScore(data.score);
        if (data.score > highestScore) {
          setHighestScore(data.score);
        }
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    }
  }, [isPlaying, highestScore]);

  // Handle reconnection attempts
  const attemptReconnect = useCallback(() => {
    if (reconnectingRef.current) return;
    
    reconnectingRef.current = true;
    const attemptReconnection = () => {
      if (reconnectionAttemptsRef.current >= MAX_RECONNECTION_ATTEMPTS) {
        toast.error("Impossible de se connecter au serveur de jeu", {
          description: "Veuillez réessayer ultérieurement.",
        });
        reconnectingRef.current = false;
        return;
      }

      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
        reconnectionAttemptsRef.current++;
        setTimeout(() => {
          if (!socketRef.current?.connected) {
            attemptReconnection();
          }
        }, RECONNECTION_DELAY);
      }
    };

    attemptReconnection();
  }, []);

  // Handle starting the game
  const handleStartGame = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error("Non connecté au serveur", {
        description: "Tentative de reconnexion...",
      });
      attemptReconnect();
      return;
    }

    const displayName = user && profile ? profile.pseudo : pseudo.trim() || "Player";
    socketRef.current.emit("join", { 
      pseudo: displayName,
      skin_id: selectedSkin
    });
    setIsPlaying(true);
    setGameOver(false);
  }, [pseudo, attemptReconnect, user, profile, selectedSkin]);

  // Handle movement controls
  const handleMovement = useCallback((direction: string, isKeyDown: boolean) => {
    if (!socketRef.current || !isPlaying) return;

    switch (direction) {
      case "up":
        movementRef.current.up = isKeyDown;
        break;
      case "down":
        movementRef.current.down = isKeyDown;
        break;
      case "left":
        movementRef.current.left = isKeyDown;
        break;
      case "right":
        movementRef.current.right = isKeyDown;
        break;
    }

    socketRef.current.emit("movement", movementRef.current);
  }, [isPlaying]);

  // Handle boost
  const handleBoost = useCallback((isKeyDown: boolean) => {
    if (!socketRef.current || !isPlaying) return;
    boosting.current = isKeyDown;
    socketRef.current.emit("boost", isKeyDown);
  }, [isPlaying]);

  // KeyDown event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPlaying || isMobile) return;

    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        handleMovement("up", true);
        break;
      case "ArrowDown":
      case "KeyS":
        handleMovement("down", true);
        break;
      case "ArrowLeft":
      case "KeyA":
        handleMovement("left", true);
        break;
      case "ArrowRight":
      case "KeyD":
        handleMovement("right", true);
        break;
      case "ShiftLeft":
      case "ShiftRight":
      case "Space":
        handleBoost(true);
        break;
    }
  }, [isPlaying, isMobile, handleMovement, handleBoost]);

  // KeyUp event handler
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isPlaying || isMobile) return;

    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        handleMovement("up", false);
        break;
      case "ArrowDown":
      case "KeyS":
        handleMovement("down", false);
        break;
      case "ArrowLeft":
      case "KeyA":
        handleMovement("left", false);
        break;
      case "ArrowRight":
      case "KeyD":
        handleMovement("right", false);
        break;
      case "ShiftLeft":
      case "ShiftRight":
      case "Space":
        handleBoost(false);
        break;
    }
  }, [isPlaying, isMobile, handleMovement, handleBoost]);

  // Setup keyboard listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Filter players with length property
  const getNonSpectatorPlayers = useCallback(() => {
    if (!gameState || !gameState.players) return {};
    
    const activePlayers: Record<string, ServerPlayer> = {};
    Object.entries(gameState.players).forEach(([id, player]) => {
      if (!player.spectator) {
        activePlayers[id] = player;
      }
    });
    
    return activePlayers;
  }, [gameState]);

  const activePlayers = gameState ? getNonSpectatorPlayers() : {};

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 text-white">
      <main className="flex-1 relative overflow-hidden">
        {isPlaying ? (
          <>
            <GameCanvas 
              gameState={gameState} 
              playerId={playerId} 
              itemRadiusRange={[MIN_ITEM_RADIUS, MAX_ITEM_RADIUS]}
            />
            
            {isMobile && (
              <MobileControls 
                onMove={handleMovement} 
                onBoost={handleBoost}
              />
            )}
            
            {playerId && gameState && (
              <PlayerScore 
                playerId={playerId} 
                players={gameState.players}
                roomLeaderboard={roomLeaderboard}
              />
            )}
            
            <LeaderboardPanel 
              roomLeaderboard={roomLeaderboard}
              globalLeaderboard={globalLeaderboard}
            />
          </>
        ) : (
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-4xl">
              <div className="mb-12 text-center">
                <ZigzagTitle title="GRUBZ.IO" colorClass="text-indigo-400" />
                <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto">
                  Le jeu de serpent multijoueur où vous pouvez vous mesurer à d'autres joueurs en temps réel
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                <div className="md:col-span-3 bg-gray-900/70 backdrop-blur-lg p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
                  <h2 className="text-2xl font-bold mb-4 text-indigo-300 flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Jouer maintenant
                  </h2>
                  
                  {!user ? (
                    <div className="mb-6">
                      <label htmlFor="pseudo" className="block text-sm font-medium text-gray-300 mb-2">
                        Votre pseudo
                      </label>
                      <Input
                        id="pseudo"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="Entrez votre pseudo"
                      />
                    </div>
                  ) : (
                    <div className="mb-6 flex items-center">
                      <User className="h-5 w-5 mr-2 text-indigo-400" />
                      <span>Vous jouez en tant que <strong>{profile?.pseudo}</strong></span>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-300 mb-3">Apparence</h3>
                    <SkinPreview />
                    {user && (
                      <div className="mt-3">
                        <Link to="/skins" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center">
                          <Palette className="h-4 w-4 mr-1" />
                          Voir tous les skins disponibles
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleStartGame}
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg"
                    >
                      Rejoindre la partie
                      <AnimatedArrow />
                    </Button>
                    
                    {!user && (
                      <div className="flex flex-col space-y-3 mt-4">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-700" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-gray-900/70 px-2 text-gray-400">Ou connectez-vous pour sauvegarder votre progression</span>
                          </div>
                        </div>
                        
                        <AuthButtons />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2 flex flex-col gap-6">
                  <div className="bg-gray-900/70 backdrop-blur-lg p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
                    <h2 className="text-xl font-bold mb-4 text-yellow-400 flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      Classement global
                    </h2>
                    <div className="space-y-3">
                      {globalLeaderboard.slice(0, 5).map((entry, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 rounded-lg bg-gray-800/60"
                        >
                          <div className="flex items-center">
                            <span className="w-6 text-center font-medium text-gray-400">#{index + 1}</span>
                            <div 
                              className="h-3 w-3 rounded-full ml-2 mr-3"
                              style={{ backgroundColor: entry.color || '#6366F1' }}
                            />
                            <span className="font-medium">{entry.pseudo || 'Joueur inconnu'}</span>
                          </div>
                          <span className="font-mono font-bold text-yellow-300">{entry.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/70 backdrop-blur-lg p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
                    <h2 className="text-xl font-bold mb-3 text-indigo-300">Comment jouer</h2>
                    <div className="space-y-2 text-gray-300 text-sm">
                      <p className="flex items-start">
                        <span className="mr-2 bg-gray-800 px-2 py-0.5 rounded text-xs">⬆️ ⬇️ ⬅️ ➡️</span>
                        <span>Utilisez les flèches ou WASD pour vous déplacer</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 bg-gray-800 px-2 py-0.5 rounded text-xs">SHIFT</span>
                        <span>Maintenez pour accélérer temporairement</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-purple-400">•</span>
                        <span>Mangez les items pour grandir et gagner des points</span>
                      </p>
                      <p className="flex items-start">
                        <span className="mr-2 text-red-400">⚠</span>
                        <span>Évitez de vous cogner contre les autres joueurs</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {!isPlaying && <Footer />}
      
      <GameOverDialog 
        open={gameOver} 
        onClose={() => setGameOver(false)}
        deathReason={deathReason}
        score={lastScore}
        highestScore={highestScore}
        onPlayAgain={handleStartGame}
      />
    </div>
  );
};

export default Index;
