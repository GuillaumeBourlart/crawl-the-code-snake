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
import { useLanguage } from "@/contexts/LanguageContext";
import SkinPreview from "@/components/SkinPreview";
import { Link } from "react-router-dom";
import AuthButtons from "@/components/AuthButtons";
import ZigzagTitle from "@/components/ZigzagTitle";
import AnimatedArrow from "@/components/AnimatedArrow";
import Footer from "@/components/Footer";
import GlobalLeaderboardButton from "@/components/GlobalLeaderboardButton";
import LanguageSelector from "@/components/LanguageSelector";

const SOCKET_SERVER_URL = "https://api.grubz.io";

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
const RECONNECTION_DELAY = 300;

const MIN_ITEM_RADIUS = 4;
const MAX_ITEM_RADIUS = 10;
const DEFAULT_ITEM_EATEN_COUNT = 18;

const Index = () => {
  const { t } = useLanguage();
  const [socket, setSocket] = useState<any>(null);
  const [tickMs, setTickMs] = useState(0);
  const [rtt, setRtt] = useState(0);
  const [fps, setFps] = useState(0);
  const [ping, setPing] = useState(0);

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
  const [skinLoadAttempted, setSkinLoadAttempted] = useState(false);

  const { leaderboard: globalLeaderboard, isLoading: isGlobalLeaderboardLoading, error: globalLeaderboardError, usesFallback } = useGlobalLeaderboard(SOCKET_SERVER_URL);
  
  const isMobile = useIsMobile();
  const moveThrottleRef = useRef(false);
  const lastDirectionRef = useRef({ x: 0, y: 0 });
  const directionIntervalRef = useRef<number | null>(null);
  const metricsIntervalRef = useRef<number | null>(null);
  const fpsAnimationFrameRef = useRef<number | null>(null);
  
  const { user, profile, loading: authLoading, updateProfile, refreshSession } = useAuth();
  const { 
    selectedSkin, 
    selectedSkinId, 
    availableSkins: userSkins, 
    refresh: refreshSkins,
    loading: skinsLoading
  } = useSkins();
  
  const availableSkinsRef = useRef<any[]>([]);

  useEffect(() => {
    // Only start performance metrics when game is active
    if (!gameStarted || !socket) return;

    console.log("Starting performance metrics");
    
    // For tick time
    let lastTickPerf = performance.now();
    const onUpdate = (payload: { serverTs?: number }) => {
      const nowPerf = performance.now();
      setTickMs(nowPerf - lastTickPerf);
      lastTickPerf = nowPerf;

      if (payload.serverTs) {
        setRtt(Date.now() - payload.serverTs);
      }
    };
    
    socket.on("update_entities", onUpdate);
    
    // For ping
    const pingInterval = 2000;
    const measurePing = () => {
      const t0 = performance.now();
      socket.emit("ping_test", null, () => {
        const rtt = performance.now() - t0;
        setPing(rtt);
      });
    };

    measurePing();
    metricsIntervalRef.current = window.setInterval(measurePing, pingInterval);
    
    // For FPS
    let frames = 0;
    let t0 = performance.now();

    const measureFps = (t: number) => {
      frames++;
      if (t - t0 >= 1000) {
        setFps(frames);
        frames = 0;
        t0 = t;
      }
      fpsAnimationFrameRef.current = requestAnimationFrame(measureFps);
    };

    fpsAnimationFrameRef.current = requestAnimationFrame(measureFps);
    
    return () => {
      socket.off("update_entities", onUpdate);
      
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
      
      if (fpsAnimationFrameRef.current) {
        cancelAnimationFrame(fpsAnimationFrameRef.current);
        fpsAnimationFrameRef.current = null;
      }
      
      console.log("Stopping performance metrics");
    };
  }, [gameStarted, socket]);

  useEffect(() => {
    if (!skinLoadAttempted) {
      console.log("[Index] Initial skins refresh");
      refreshSkins();
      setSkinLoadAttempted(true);
    }
  }, [skinLoadAttempted, refreshSkins]);
  
  useEffect(() => {
    if (userSkins && userSkins.length > 0 && 
        JSON.stringify(availableSkinsRef.current) !== JSON.stringify(userSkins)) {
      console.log("[Index] Setting available skins from userSkins:", userSkins.length);
      availableSkinsRef.current = userSkins;
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
        socket.disconnect();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (socket) socket.disconnect();
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (directionIntervalRef.current) window.clearInterval(directionIntervalRef.current);
      if (metricsIntervalRef.current) window.clearInterval(metricsIntervalRef.current);
      if (fpsAnimationFrameRef.current) cancelAnimationFrame(fpsAnimationFrameRef.current);

      document.body.classList.remove('game-active');
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
      toast.info(`Reconnection attempt (${reconnectAttempts + 1}/${MAX_RECONNECTION_ATTEMPTS})...`);
      reconnectTimerRef.current = window.setTimeout(() => {
        handlePlay();
      }, RECONNECTION_DELAY);
    } else {
      toast.error("Unable to reconnect to server after multiple attempts");
      setConnecting(false);
      setReconnectAttempts(0);
    }
  }, [reconnectAttempts]);
  
  const handlePlay = () => {
    if (!username.trim()) {
      toast.error("Please enter a pseudo before playing");
      return;
    }
    
    if (user && profile && username !== profile.pseudo) {
      updateProfile({ pseudo: username });
    }
    
    if (!selectedSkinId) {
      toast.error("Please select a skin before playing");
      return;
    }
    
    console.log("Starting game with skin ID:", selectedSkinId);
    
    setConnecting(true);
    setShowGameOverDialog(false);
    setIsSpectator(false);
    
    if (socket) {
      socket.disconnect();
    }
    
    console.log("Connecting to socket server:", SOCKET_SERVER_URL);
    
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
      toast.success("Connected to server");
    });
    
    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnecting(false);
      toast.error("Server connection error");
      attemptReconnect();
    });
    
    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from WebSocket server. Reason:", reason);
      setConnected(false);
      setGameStarted(false);
      setRoomId(null);
      
      if (reason === "io server disconnect") {
        toast.error("Disconnected by server");
      } else if (reason === "transport close") {
        toast.error("Connection lost");
        attemptReconnect();
      } else if (reason === "ping timeout") {
        toast.error("Server timeout exceeded");
        attemptReconnect();
      } else {
        toast.error("Disconnected from server");
      }
    });
    
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      toast.error("Socket error: " + error);
      
      if (!connected) {
        attemptReconnect();
      }
    });
    
    newSocket.on("joined_room", (data: { roomId: string }) => {
      console.log("Joined room:", data.roomId);
      setRoomId(data.roomId);
      setPlayerId(newSocket.id);
      setGameStarted(true);
      
      document.body.classList.add('game-active');
      
      console.log("Sending player info to server with skin:", selectedSkinId);
      
      newSocket.emit("setPlayerInfo", { 
        pseudo: username,
        skin_id: selectedSkinId
      });
      
      toast.success("You have joined the game");
    });
    
    newSocket.on("update_entities", (data: { players: Record<string, ServerPlayer>; items: GameItem[]; leaderboard: PlayerLeaderboardEntry[]; worldSize?: { width: number; height: number } }) => {
      const itemsObject: Record<string, GameItem> = {};
      data.items.forEach(item => {
        itemsObject[item.id] = item;
      });
      
      setGameState(prevState => ({
        ...prevState,
        players: data.players,
        items: itemsObject,
        worldSize: data.worldSize || prevState.worldSize
      }));
      
      if (data.leaderboard) {
        setRoomLeaderboard(data.leaderboard);
      }
    });
    
    newSocket.on("player_eliminated", () => {
      console.log("You were eliminated!");
      toast.error("You were eliminated!");
      setIsSpectator(true);
      setShowGameOverDialog(true);
    });
    
    newSocket.on("no_room_available", () => {
      toast.error("No room available");
      setConnecting(false);
      newSocket.disconnect();
    });
    
    newSocket.on("ping_request", () => {
      newSocket.emit("pong_response");
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
  
  const handleQuitGame = () => {
    if (socket) {
      socket.disconnect();
    }
    setGameStarted(false);
    setShowGameOverDialog(false);
    setPlayerId(null);
    setRoomId(null);
    setIsSpectator(false);
    
    document.body.classList.remove('game-active');
  };

  const handleRetry = () => {
    if (socket) {
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

  useEffect(() => {
    if (gameStarted) {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.body.classList.add('game-active');
    } else {
      document.body.classList.remove('game-active');
    }
    
    return () => {
      document.body.classList.remove('game-active');
    };
  }, [gameStarted]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      {!gameStarted && (
        <div className="absolute top-4 left-4 z-50">
          <LanguageSelector />
        </div>
      )}
      
      {!gameStarted && (
        <div className="absolute top-4 right-4 z-50">
          <AuthButtons />
        </div>
      )}

      
      {!gameStarted && (
        <div className="z-10 flex flex-col items-center justify-center p-8 rounded-2xl w-full max-w-screen-sm mx-auto animate-fade-in mt-12 sm:mt-24">
          <div className="flex items-center justify-center mb-6 w-full overflow-visible">
            <div className="w-full max-w-[1000px]">
            <ZigzagTitle className="w-full h-auto" />
            </div>
        </div>

          
          <div className="w-full max-w-sm mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <User className="h-5 w-5" />
              </div>
              <Input
                type="text"
                placeholder={t('enter_username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-white bg-gray-800/60 border-gray-700/70 pl-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 py-6 rounded-full"
                maxLength={16}
                required
              />
            </div>
          </div>
          
          <div className="w-full max-w-sm mb-8">
            <Link to="/skins" className="block bg-gray-800/40 rounded-full p-4 border border-gray-700/50 hover:bg-gray-700/50 transition-colors">
              {false ? (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
                </div>
              ) : (
                selectedSkin ? (
                  <div className="flex flex-col items-center">
                    <SkinPreview skin={selectedSkin} size="medium" animate={true} pattern="snake" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <p className="text-gray-400">{t('no_skin_selected')}</p>
                    <p className="text-xs text-indigo-400 mt-2">{t('click_to_choose')}</p>
                  </div>
                )
              )}
            </Link>
          </div>
          
          <div className="flex flex-col w-full max-w-sm gap-3">
            <button
              className="relative w-full flex flex-col items-center justify-center mx-auto transition-all duration-300 h-32 disabled:opacity-50 disabled:cursor-not-allowed overflow-visible"
              onClick={handlePlay}
              disabled={connecting || !username.trim() || !selectedSkinId}
            >
              {connecting ? (
                <div className="p-5">
                  <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center mb-6 w-full overflow-visible">
  <div className="w-2/3 sm:w-1/2">
    <AnimatedArrow
      className="w-full h-auto"
      isClickable={Boolean(username.trim() && selectedSkinId)}
    />
  </div>
</div>

              )}
            </button>
          </div>
          
          {reconnectAttempts > 0 && (
            <p className="mt-4 text-amber-400 flex items-center">
              <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Reconnection attempt {reconnectAttempts}/{MAX_RECONNECTION_ATTEMPTS}
            </p>
          )}
        </div>
      )}
      
      {gameStarted && (
        <>
          <div className="absolute top-4 right-4 z-20 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-gray-900/70 border-red-500/30 text-white hover:bg-red-900/30 rounded-lg shadow-md"
              onClick={handleQuitGame}
            >
              <LogOut className="mr-1 h-4 w-4 text-red-400" />
              {t('quit')}
            </Button>
          </div>
          
          {isSpectator && (
            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-red-600/70 text-white rounded-lg shadow-md">
              {t('spectator_mode')}
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

          <div className="absolute top-[110px] left-4 z-20 text-xs font-mono text-white/90">
            <div>FPS: {fps}</div>
            <div>Tick: {tickMs.toFixed(1)} ms</div>
            <div>RTT: {rtt.toFixed(1)} ms</div>
            <div>Ping: {ping.toFixed(1)} ms</div>
          </div>
          
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
      {!gameStarted && <GlobalLeaderboardButton />}

      {!gameStarted && <Footer />}
    </div>
  );
};

export default Index;
