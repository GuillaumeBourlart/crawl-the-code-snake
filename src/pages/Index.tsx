
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

interface ServerGameState {
  players: Record<string, ServerPlayer>;
  items?: Record<string, any>;
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
      const playerColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
      const randomColor = playerColors[Math.floor(Math.random() * playerColors.length)];
      
      // Set initial gameState with the player
      setGameState(prevState => ({
        ...prevState,
        players: {
          ...prevState.players,
          [newSocket.id]: {
            x: Math.random() * 800,
            y: Math.random() * 600,
            length: 10,
            color: randomColor,
            segments: []
          }
        }
      }));
      
      toast.success("Vous avez rejoint la partie");
    });
    
    // No rooms available
    newSocket.on("no_room_available", () => {
      toast.error("Aucune salle disponible");
      setConnecting(false);
      newSocket.disconnect();
    });
    
    // Players update
    newSocket.on("update_players", (players: Record<string, ServerPlayer>) => {
      console.log("Players update:", players);
      
      // Convert incoming server data format to client format if needed
      const processedPlayers = Object.entries(players).reduce((acc, [id, player]) => {
        return {
          ...acc,
          [id]: {
            ...player,
            size: player.length || 10, // Ensure size is set for rendering
            segments: player.segments || []
          }
        };
      }, {});
      
      setGameState(prevState => ({
        ...prevState,
        players: processedPlayers
      }));
    });
    
    setSocket(newSocket);
  };
  
  const handleMove = (direction: { x: number; y: number }) => {
    if (socket && gameStarted && playerId) {
      // Get the current player position
      const player = gameState.players[playerId];
      if (!player) return;

      // Calculate new position based on current position and direction
      // We'll use a speed factor to control how fast the player moves
      const speed = 5;
      const newX = player.x + direction.x * speed;
      const newY = player.y + direction.y * speed;

      // Send the new position to the server
      socket.emit("move", { x: newX, y: newY });
    }
  };
  
  const handleBoost = () => {
    if (socket && gameStarted) {
      socket.emit("boost");
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
              ...gameState,
              players: gameState.players || {},
              worldSize: gameState.worldSize || { width: 2000, height: 2000 }
            }}
            playerId={playerId} 
            onMove={handleMove}
            onBoost={handleBoost}
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
