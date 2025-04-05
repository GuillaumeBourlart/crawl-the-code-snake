
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GameCanvas from "@/components/GameCanvas";
import { createClient } from "@supabase/supabase-js";
import { io } from "socket.io-client";
import MobileControls from "@/components/MobileControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

// Supabase client initialization (optionnel ici)
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
  queue?: Array<{ x: number; y: number }>;  // Propriété "queue" utilisée par le serveur
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
  items?: Record<string, GameItem> | GameItem[];
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
    items: {},
    worldSize: { width: 2000, height: 2000 }
  });
  
  const isMobile = useIsMobile();
  
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);
  
  const generateRandomItems = (count: number, worldSize: { width: number; height: number }) => {
    const items: Record<string, GameItem> = {};
    const itemColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5', '#FFD133', '#8F33FF'];
    for (let i = 0; i < count; i++) {
      const id = `item-${i}`;
      items[id] = {
        id,
        x: Math.random() * worldSize.width,
        y: Math.random() * worldSize.height,
        value: Math.floor(Math.random() * 5) + 1,
        color: itemColors[Math.floor(Math.random() * itemColors.length)]
      };
    }
    return items;
  };
  
  const handlePlay = () => {
    setConnecting(true);
    const newSocket = io("https://codecrawl-production.up.railway.app", {
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
      toast.success("Connecté au serveur");
    });
    
    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnecting(false);
      toast.error("Erreur de connexion au serveur");
    });
    
    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setConnected(false);
      setGameStarted(false);
      setRoomId(null);
      toast.error("Déconnecté du serveur");
    });
    
    newSocket.on("joined_room", (data: { roomId: string }) => {
      console.log("Joined room:", data.roomId);
      setRoomId(data.roomId);
      setPlayerId(newSocket.id);
      setGameStarted(true);
      
      const playerColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#8B5CF6', '#D946EF', '#F97316', '#0EA5E9'];
      const randomColor = playerColors[Math.floor(Math.random() * playerColors.length)];
      const worldSize = { width: 2000, height: 2000 };
      const randomItems = generateRandomItems(50, worldSize);
      
      // Initialiser l'état de jeu avec la propriété "queue" vide pour le joueur
      setGameState(prevState => ({
        ...prevState,
        players: {
          ...prevState.players,
          [newSocket.id]: {
            x: Math.random() * 800,
            y: Math.random() * 600,
            length: 20,
            color: randomColor,
            queue: []  // Queue initialement vide
          }
        },
        items: randomItems,
        worldSize
      }));
      
      toast.success("Vous avez rejoint la partie");
    });
    
    newSocket.on("player_eliminated", () => {
      console.log("You were eliminated!");
      toast.error("Vous avez été éliminé!");
      setGameStarted(false);
      setTimeout(() => {
        newSocket.emit("join_room");
      }, 1500);
    });
    
    newSocket.on("player_grew", (data: { growth: number }) => {
      console.log("You ate another player! Growing by:", data.growth);
      toast.success(`Vous avez mangé un joueur! +${data.growth} points`);
      if (playerId) {
        setGameState(prevState => {
          const currentPlayer = prevState.players[playerId];
          if (!currentPlayer) return prevState;
          let newQueue = [...(currentPlayer.queue || [])];
          for (let i = 0; i < data.growth; i++) {
            newQueue.push({ x: currentPlayer.x, y: currentPlayer.y });
          }
          return {
            ...prevState,
            players: {
              ...prevState.players,
              [playerId]: {
                ...currentPlayer,
                queue: newQueue
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
    
    newSocket.on("update_players", (players: Record<string, ServerPlayer>) => {
      console.log("Players update:", players);
      const processedPlayers = Object.entries(players).reduce((acc, [id, player]) => ({
        ...acc,
        [id]: { ...player, queue: player.queue || [] }
      }), {});
      setGameState(prevState => ({
        ...prevState,
        players: processedPlayers
      }));
    });
    
    newSocket.on("update_items", (items: Record<string, GameItem> | GameItem[]) => {
      console.log("Items update:", items);
      // Convertir array en objet si nécessaire
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
    if (socket && gameStarted && playerId) {
      const player = gameState.players[playerId];
      if (!player) return;
      const speed = player.boosting ? 10 : 5;
      const newX = player.x + direction.x * speed;
      const newY = player.y + direction.y * speed;
      const worldWidth = gameState.worldSize?.width || 2000;
      const worldHeight = gameState.worldSize?.height || 2000;
      const playerQueueLength = player.queue?.length || 0;
      const baseSize = 20;
      const playerSize = baseSize * (1 + (playerQueueLength * 0.1));
      const boundedX = Math.max(playerSize, Math.min(worldWidth - playerSize, newX));
      const boundedY = Math.max(playerSize, Math.min(worldHeight - playerSize, newY));
      
      socket.emit("move", { x: boundedX, y: boundedY });
      
      // Le serveur gère maintenant la mise à jour de la queue, donc nous n'avons pas besoin
      // de mettre à jour la queue localement, juste la position du joueur
      setGameState(prevState => {
        if (!prevState.players[playerId]) return prevState;
        return {
          ...prevState,
          players: {
            ...prevState.players,
            [playerId]: {
              ...prevState.players[playerId],
              x: boundedX,
              y: boundedY
            }
          }
        };
      });
    }
  };
  
  const handleBoost = () => {
    if (socket && gameStarted) {
      socket.emit("boost");
    }
  };
  
  const handleCollectItem = (itemId: string) => {
    // Cette fonction n'est plus nécessaire car la collecte d'items
    // est gérée entièrement côté serveur via le gestionnaire de mouvement
    console.log("Item collection is now handled server-side");
  };
  
  const handlePlayerCollision = (otherPlayerId: string) => {
    if (socket && gameStarted && playerId) {
      const currentPlayer = gameState.players[playerId];
      const otherPlayer = gameState.players[otherPlayerId];
      if (!currentPlayer || !otherPlayer) return;
      const currentQueueLength = currentPlayer.queue?.length || 0;
      const otherQueueLength = otherPlayer.queue?.length || 0;
      
      if (currentQueueLength < otherQueueLength) {
        socket.emit("player_eliminated", { eliminatedBy: otherPlayerId });
        toast.error("Vous avez été éliminé!");
        setGameStarted(false);
        setTimeout(() => {
          handlePlay();
        }, 1500);
      } else if (currentQueueLength > otherQueueLength) {
        socket.emit("eat_player", { eatenPlayer: otherPlayerId });
        // La croissance sera gérée par le serveur via l'événement player_grew
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
              ...gameState,
              players: gameState.players || {},
              // Convertir l'objet items en tableau pour le passer à GameCanvas
              items: gameState.items ? Object.values(gameState.items) : [],
              worldSize: gameState.worldSize || { width: 2000, height: 2000 }
            }}
            playerId={playerId} 
            onMove={handleMove}
            onBoost={handleBoost}
            onCollectItem={handleCollectItem}
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
