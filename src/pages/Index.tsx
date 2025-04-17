// src/pages/Index.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GameCanvas from "@/components/GameCanvas";
import { io } from "socket.io-client";
import MobileControls from "@/components/MobileControls";
import { useIsMobile } from "@/hooks/use-mobile";
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

interface ServerPlayer { /* … */ }
interface GameItem { /* … */ }
interface ServerGameState { /* … */ }
interface PlayerLeaderboardEntry { id: string; score: number; color: string; pseudo?: string }

export default function Index() {
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
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);
  const [roomLeaderboard, setRoomLeaderboard] = useState<PlayerLeaderboardEntry[]>([]);
  const [username, setUsername] = useState("");
  const [isSpectator, setIsSpectator] = useState(false);

  const isMobile = useIsMobile();
  const lastDirectionRef = useRef({ x: 0, y: 0 });
  const directionIntervalRef = useRef<number | null>(null);

  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { selectedSkin, selectedSkinId, refresh: refreshSkins } = useSkins();

  // … WebSocket, performance metrics, reconnect, cleanup, etc.
  // (Identique à votre version, mais **sans** aucune écoute ou appel à `toast`)

  const handlePlay = () => {
    if (!username.trim()) return;
    if (user && profile && username !== profile.pseudo) {
      updateProfile({ pseudo: username });
    }
    if (!selectedSkinId) return;

    setConnecting(true);
    setIsSpectator(false);
    setShowGameOverDialog(false);
    if (socket) socket.disconnect();

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      upgrade: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnected(true);
      setConnecting(false);
    });
    newSocket.on("joined_room", (data: { roomId: string }) => {
      setRoomId(data.roomId);
      setPlayerId(newSocket.id);
      setGameStarted(true);
      newSocket.emit("setPlayerInfo", {
        pseudo: username,
        skin_id: selectedSkinId
      });
    });
    newSocket.on("update_entities", (data) => {
      setGameState(gs => ({
        ...gs,
        players: data.players,
        items: data.items.reduce((o: any, i: any) => ((o[i.id] = i), o), {})
      }));
      setRoomLeaderboard(data.leaderboard);
    });
    newSocket.on("player_eliminated", () => {
      setIsSpectator(true);
      setShowGameOverDialog(true);
    });
    // …
    newSocket.emit("join_room");
  };

  const handleMove = (direction: { x: number; y: number }) => {
    lastDirectionRef.current = direction;
  };

  const handleBoostStart = () => { socket?.emit("boostStart"); };
  const handleBoostStop = () => { socket?.emit("boostStop"); };

  const handleQuitGame = () => {
    socket?.disconnect();
    setGameStarted(false);
    setPlayerId(null);
    setRoomId(null);
    setIsSpectator(false);
  };

  const handleRetry = () => {
    socket?.disconnect();
    setShowGameOverDialog(false);
    setIsSpectator(false);
    handlePlay();
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center text-white overflow-hidden">
      {!gameStarted && (
        <div className="z-10 flex flex-col items-center justify-center p-8 rounded-2xl w-full animate-fade-in space-y-8">

          {/* ─── Gros titre ─── */}
          <div className="w-full max-w-4xl mx-auto">
            <ZigzagTitle className="w-full" />
          </div>

          {/* ─── Champ pseudo ─── */}
          <div className="w-full max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                <User className="h-5 w-5" />
              </div>
              <Input
                type="text"
                placeholder={t("enter_username")}
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-gray-800/60 border-gray-700/70 pl-10 py-6 rounded-full text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                maxLength={16}
              />
            </div>
          </div>

          {/* ─── Preview de skin ─── */}
          <div className="w-full max-w-sm mx-auto">
            <Link
              to="/skins"
              className="block w-full bg-gray-800/40 rounded-full p-4 border border-gray-700/50 hover:bg-gray-700/50 transition-colors"
            >
              {selectedSkin
                ? <SkinPreview skin={selectedSkin} size="medium" animate pattern="snake" />
                : (
                  <div className="py-4 text-center text-gray-400">
                    {t("no_skin_selected")}<br/>
                    <span className="text-xs text-indigo-400">{t("click_to_choose")}</span>
                  </div>
                )
              }
            </Link>
          </div>

          {/* ─── Bouton Jouer ─── */}
          <div className="w-full max-w-md mx-auto">
            <button
              onClick={handlePlay}
              disabled={connecting || !username.trim() || !selectedSkinId}
              className="relative w-full h-32 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting
                ? <div className="p-5"><svg className="animate-spin h-12 w-12 text-white" …/></div>
                : <AnimatedArrow className="w-full h-32" isClickable />
              }
            </button>
          </div>

        </div>
      )}

      {gameStarted && (
        <>
          {/* ─── En‑jeu ─── */}
          <div className="absolute top-4 right-4 z-20 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-900/70 border-red-500/30 text-red-500 hover:bg-red-900/30 rounded-lg shadow-md"
              onClick={handleQuitGame}
            >
              <LogOut className="mr-1 h-4 w-4 text-red-400"/> {t("cancel")}
            </Button>
          </div>

          <PlayerScore playerId={playerId} players={gameState.players} roomLeaderboard={roomLeaderboard}/>
          <LeaderboardPanel
            roomLeaderboard={roomLeaderboard}
            currentPlayerId={playerId}
            columns={{ rank: t("rang"), player: t("joueurs"), score: t("score") }}
          />

          <GameCanvas
            gameState={{
              players: gameState.players,
              items: Object.values(gameState.items || {}),
              worldSize: gameState.worldSize || { width: 4000, height: 4000 }
            }}
            playerId={playerId}
            onMove={handleMove}
            onBoostStart={handleBoostStart}
            onBoostStop={handleBoostStop}
            isSpectator={isSpectator}
          />

          {isMobile && !isSpectator &&
            <MobileControls onMove={handleMove} onBoostStart={handleBoostStart} onBoostStop={handleBoostStop}/>
          }

          <GameOverDialog
            isOpen={showGameOverDialog}
            onClose={() => setShowGameOverDialog(false)}
            onRetry={handleRetry}
            onQuit={handleQuitGame}
            playerColor={playerId && gameState.players[playerId]?.color}
          />
        </>
      )}

      {!gameStarted && <Footer />}
    </div>
  );
}
