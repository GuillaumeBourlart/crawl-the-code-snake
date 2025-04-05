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
  items?: Record<string, GameItem>;
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
    // Cleanup function - will be called when component unmounts
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);
  
  // Generate random items across the map
  const generateRandomItems = (count: number, worldSize: { width: number; height: number }) => {
    const items: Record<string, GameItem> = {};
    const itemColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5', '#FFD133', '#8F33FF'];
    
    for (let i = 0; i < count; i++) {
      const id = `item-${i}`;
      items[id] = {
        id,
        x: Math.random() * worldSize.width,
        y: Math.random() * worldSize.height,
        value: Math.floor(Math.random() * 5) + 1, // Value between 1 and 5
        color: itemColors[Math.floor(Math.random() * itemColors.length)]
      };
    }
    
    return items;
  };
  
  // Function to generate initial segments for a snake
  const generateInitialSegments = (x: number, y: number, count: number = 5): Array<{x: number, y: number}> => {
    const segments = [];
    // Create segments in a line behind the player head position
    for (let i = 0; i < count; i++) {
      segments.push({
        x: x - (i * 5), // Space them out behind the player
        y: y
      });
    }
    return segments;
  };
  
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
      
      // Generate random starting position
      const startX = Math.random() * 800;
      const startY = Math.random() * 600;
      
      // Generate random items
      const worldSize = { width: 2000, height: 2000 };
      const randomItems = generateRandomItems(50, worldSize);
      
      // Set initial gameState with the player and items
      setGameState(prevState => ({
        ...prevState,
        players: {
          ...prevState.players,
          [newSocket.id]: {
            x: startX,
            y: startY,
            length: 20, // Starting size
            color: randomColor,
            segments: generateInitialSegments(startX, startY), // Initialize with segments
            direction: { x: 1, y: 0 } // Initial direction (right)
          }
        },
        items: randomItems,
        worldSize
      }));
      
      toast.success("Vous avez rejoint la partie");
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
    
    // Player grew from eating another player
    newSocket.on("player_grew", (data: { growth: number }) => {
      console.log("You ate another player! Growing by:", data.growth);
      toast.success(`Vous avez mangé un joueur! +${data.growth} points`);
      
      // Update player size locally (will be overridden by next update from server)
      if (playerId) {
        setGameState(prevState => {
          const currentPlayer = prevState.players[playerId];
          if (!currentPlayer) return prevState;
          
          // Add new segments
          const newSegments = [...(currentPlayer.segments || [])];
          const lastSegment = newSegments.length > 0 ? newSegments[newSegments.length - 1] : { x: currentPlayer.x, y: currentPlayer.y };
          
          // Add segments at the end of the trail
          for (let i = 0; i < data.growth; i++) {
            newSegments.push({ x: lastSegment.x, y: lastSegment.y });
          }
          
          return {
            ...prevState,
            players: {
              ...prevState.players,
              [playerId]: {
                ...currentPlayer,
                length: (currentPlayer.length || 20) + data.growth,
                segments: newSegments
              }
            }
          };
        });
      }
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
      const processedPlayers: Record<string, ServerPlayer> = {};
      
      Object.entries(players).forEach(([id, player]) => {
        processedPlayers[id] = {
          ...player,
          size: player.length || 20, // Ensure size is set for rendering
          segments: player.segments || []
        };
      });
      
      setGameState(prevState => ({
        ...prevState,
        players: processedPlayers
      }));
      
      // Check for collisions with other players
      if (playerId && processedPlayers[playerId]) {
        const currentPlayer = processedPlayers[playerId];
        
        Object.entries(processedPlayers).forEach(([otherId, otherPlayer]) => {
          if (otherId === playerId) return; // Don't check collision with self
          
          const dx = currentPlayer.x - otherPlayer.x;
          const dy = currentPlayer.y - otherPlayer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const currentSize = currentPlayer.length || 20;
          const otherSize = otherPlayer.length || 20;
          
          // If players are touching
          if (distance < (currentSize + otherSize) / 2) {
            // If the current player is smaller, they get eliminated
            if (currentSize < otherSize) {
              newSocket.emit("player_eliminated", { eliminatedBy: otherId });
              toast.error("Vous avez été éliminé!");
              setGameStarted(false);
              setTimeout(() => {
                handlePlay();
              }, 1500);
            } 
            // If the current player is bigger, they eat the other player
            else if (currentSize > otherSize) {
              newSocket.emit("eat_player", { eatenPlayer: otherId });
            }
          }
        });
      }
    });
    
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
      const playerSize = player.length || 20;
      
      // Restrict movement to within the boundaries with a small margin
      const boundedX = Math.max(playerSize, Math.min(worldWidth - playerSize, newX));
      const boundedY = Math.max(playerSize, Math.min(worldHeight - playerSize, newY));
      
      // Create a new segments array by shifting all segments
      let newSegments = [...(player.segments || [])];
      
      // Add current position as the new head segment
      newSegments.unshift({ x: player.x, y: player.y });
      
      // Limit segments length to player's length
      const segmentLength = Math.max(5, Math.floor((player.length || 20) / 4));
      newSegments = newSegments.slice(0, segmentLength);
      
      // Update local game state immediately for smooth movement
      setGameState(prevState => ({
        ...prevState,
        players: {
          ...prevState.players,
          [playerId]: {
            ...player,
            x: boundedX,
            y: boundedY,
            direction: { x: direction.x, y: direction.y },
            segments: newSegments
          }
        }
      }));

      // Send the new position to the server
      socket.emit("move", { 
        x: boundedX, 
        y: boundedY,
        direction: direction,
        segments: newSegments
      });
    }
  };
  
  const handleBoost = () => {
    if (socket && gameStarted) {
      socket.emit("boost");
      
      // Update local state to show boost effect immediately
      if (playerId) {
        setGameState(prev => {
          const player = prev.players[playerId];
          if (!player) return prev;
          
          return {
            ...prev,
            players: {
              ...prev.players,
              [playerId]: {
                ...player,
                boosting: true
              }
            }
          };
        });
        
        // Reset boost effect after a short delay
        setTimeout(() => {
          setGameState(prev => {
            const player = prev.players[playerId];
            if (!player) return prev;
            
            return {
              ...prev,
              players: {
                ...prev.players,
                [playerId]: {
                  ...player,
                  boosting: false
                }
              }
            };
          });
        }, 500);
      }
    }
  };
  
  const handleCollectItem = (itemId: string) => {
    if (socket && gameStarted && playerId) {
      const item = gameState.items?.[itemId];
      if (!item) return;
      
      socket.emit("collect_item", { itemId });
      
      // Grow the player based on the item value
      const growthAmount = item.value || 1;
      
      // Update local game state (optimistic update)
      setGameState(prevState => {
        // Remove the collected item
        if (!prevState.items) return prevState;
        const newItems = { ...prevState.items };
        delete newItems[itemId];
        
        // Grow the player
        const currentPlayer = prevState.players[playerId];
        if (!currentPlayer) return { ...prevState, items: newItems };
        
        const newLength = (currentPlayer.length || 20) + growthAmount;
        
        // Add new segments based on growth amount
        const segments = [...(currentPlayer.segments || [])];
        const lastSegment = segments.length > 0 ? segments[segments.length - 1] : { x: currentPlayer.x, y: currentPlayer.y };
        
        // Add new segments at the end
        for (let i = 0; i < growthAmount; i++) {
          segments.push({ x: lastSegment.x, y: lastSegment.y });
        }
        
        return {
          ...prevState,
          items: newItems,
          players: {
            ...prevState.players,
            [playerId]: {
              ...currentPlayer,
              length: newLength,
              segments: segments
            }
          }
        };
      });
      
      // Add a new item to replace the one that was collected
      const worldSize = gameState.worldSize || { width: 2000, height: 2000 };
      const itemColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5', '#FFD133', '#8F33FF'];
      
      const newItemId = `item-${Date.now()}`;
      const newItem: GameItem = {
        id: newItemId,
        x: Math.random() * worldSize.width,
        y: Math.random() * worldSize.height,
        value: Math.floor(Math.random() * 5) + 1,
        color: itemColors[Math.floor(Math.random() * itemColors.length)]
      };
      
      setGameState(prevState => ({
        ...prevState,
        items: {
          ...prevState.items,
          [newItemId]: newItem
        }
      }));
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
            onCollectItem={handleCollectItem}
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
