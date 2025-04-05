
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GameCanvas from "@/components/GameCanvas";
import { createClient } from "@supabase/supabase-js";
import { io } from "socket.io-client";
import MobileControls from "@/components/MobileControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

// Supabase client initialization
const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwMTQsImV4cCI6MjA1OTM2MjAxNH0.ge6A-qatlKPDFKA4N19KalL5fU9FBD4zBgIoXnKRRUc";
const supabase = createClient(supabaseUrl, supabaseKey);

// Game state interfaces
interface ServerPlayer {
  id?: string;
  x: number;
  y: number;
  length?: number;
  color?: string;
  direction?: { x: number; y: number };
  segments?: Array<{ x: number; y: number }>;
  boosting?: boolean;
}

interface GameItem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
}

interface ServerGameState {
  players: Record<string, ServerPlayer>;
  items?: GameItem[]; // Assurez-vous que c'est un tableau et non un Record
  worldSize?: { width: number; height: number };
}

const Index = () => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<ServerGameState>({
    players: {},
    items: [],
    worldSize: { width: 2000, height: 2000 }
  });
  
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Cleanup function - will be called when component unmounts
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);
  
  const handlePlay = () => {
    setConnecting(true);
    
    // Create a new socket connection
    const newSocket = io("https://codecrawl-production.up.railway.app", {
      transports: ["websocket"],
      upgrade: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    
    // Connection established
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setConnected(true);
      setConnecting(false);
      toast.success("Connecté au serveur");
    });
    
    // Connection error
    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnecting(false);
      toast.error("Erreur de connexion au serveur");
    });
    
    // Disconnected from server
    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setConnected(false);
      setGameStarted(false);
      setRoomId(null);
      toast.error("Déconnecté du serveur");
    });
    
    // Joined a room
    newSocket.on("joined_room", (data: { roomId: string }) => {
      console.log("Joined room:", data.roomId);
      setRoomId(data.roomId);
      setPlayerId(newSocket.id);
      setGameStarted(true);
      
      // Initialize the player with a random color
      const playerColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#8B5CF6', '#D946EF', '#F97316', '#0EA5E9'];
      const randomColor = playerColors[Math.floor(Math.random() * playerColors.length)];
      
      // Set initial gameState
      setGameState(prevState => ({
        ...prevState,
        players: {},
        worldSize: { width: 2000, height: 2000 }
      }));
      
      toast.success("Vous avez rejoint la partie");
    });
    
    // Players update from server
    newSocket.on("update_players", (players: Record<string, ServerPlayer>) => {
      console.log("Players update:", players);
      
      setGameState(prevState => ({
        ...prevState,
        players: players
      }));
    });
    
    // Items update from server
    newSocket.on("update_items", (items: GameItem[]) => {
      console.log("Items update:", items);
      
      setGameState(prevState => ({
        ...prevState,
        items: items // Gardez items comme un tableau
      }));
    });
    
    // Player eliminated
    newSocket.on("player_eliminated", () => {
      console.log("You were eliminated!");
      toast.error("Vous avez été éliminé!");
      setGameStarted(false);
      
      // Optionally reconnect after a short delay
      setTimeout(() => {
        newSocket.emit("join_room");
      }, 1500);
    });
    
    // No rooms available
    newSocket.on("no_room_available", () => {
      toast.error("Aucune salle disponible");
      setConnecting(false);
      newSocket.disconnect();
    });
    
    // Join a room to start the game
    newSocket.emit("join_room");
    
    setSocket(newSocket);
  };
  
  const handleMove = (direction: { x: number; y: number }) => {
    if (socket && gameStarted && playerId) {
      // Get the current player position
      const player = gameState.players[playerId];
      if (!player) return;

      // Calculate new position based on current position and direction
      const speed = 5;
      const newX = player.x + direction.x * speed;
      const newY = player.y + direction.y * speed;

      // Check boundaries to ensure the player stays within the game world
      const worldWidth = gameState.worldSize?.width || 2000;
      const worldHeight = gameState.worldSize?.height || 2000;
      const playerSegments = player.segments?.length || 0;
      const playerSize = 20 * (1 + (playerSegments * 0.1)); // Calculate size based on segments
      
      // Restrict movement to within the boundaries with a small margin
      const boundedX = Math.max(playerSize, Math.min(worldWidth - playerSize, newX));
      const boundedY = Math.max(playerSize, Math.min(worldHeight - playerSize, newY));

      // Send the new position to the server - this will handle collisions, etc.
      socket.emit("move", { x: boundedX, y: boundedY });
    }
  };
  
  const handleBoost = () => {
    if (socket && gameStarted) {
      socket.emit("boost");
    }
  };
  
  const handlePlayerCollision = (otherPlayerId: string) => {
    if (socket && gameStarted && playerId) {
      const currentPlayer = gameState.players[playerId];
      const otherPlayer = gameState.players[otherPlayerId];
      
      if (!currentPlayer || !otherPlayer) return;
      
      // Calculate player sizes based on segments
      const currentPlayerSegments = currentPlayer.segments?.length || 0;
      const otherPlayerSegments = otherPlayer.segments?.length || 0;
      
      // If the current player is smaller, they get eliminated
      if (currentPlayerSegments < otherPlayerSegments) {
        socket.emit("player_eliminated", { eliminatedBy: otherPlayerId });
      }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      {!gameStarted && (
        <div className="z-10 flex flex-col items-center justify-center p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            Code Crawl
          </h1>
          <p className="text-gray-300 mb-8 text-center max-w-md">
            Naviguez avec votre processeur, collectez des fragments de code et évitez les collisions avec les traces des autres joueurs.
          </p>
          <Button
            className="px-8 py-6 text-lg bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
            onClick={handlePlay}
            disabled={connecting}
          >
            {connecting ? "Connexion..." : "JOUER"}
          </Button>
          
          <div className="absolute top-0 left-0 w-full h-full -z-10">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-blue-500/10"
                style={{
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float ${Math.random() * 10 + 5}s infinite linear`
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      {gameStarted && (
        <>
          <GameCanvas 
            gameState={{
              players: gameState.players || {},
              worldSize: gameState.worldSize || { width: 2000, height: 2000 },
              items: gameState.items || []
            }}
            playerId={playerId} 
            onMove={handleMove}
            onBoost={handleBoost}
            onPlayerCollision={handlePlayerCollision}
          />
          
          {isMobile && (
            <MobileControls onMove={handleMove} onBoost={handleBoost} />
          )}
        </>
      )}
    </div>
  );
};

export default Index;
