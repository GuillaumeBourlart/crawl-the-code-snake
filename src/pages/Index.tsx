
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import GameCanvas from "@/components/GameCanvas";
import { createClient } from "@supabase/supabase-js";
import { io } from "socket.io-client";
import MobileControls from "@/components/MobileControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

// Supabase client initialization (utilisé ici pour référence, si nécessaire)
const supabaseUrl = "https://ckvbjbclofykscigudjs.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdmJqYmNsb2Z5a3NjaWd1ZGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwMTQsImV4cCI6MjA1OTM2MjAxNH0.ge6A-qatlKPDFKA4N19KalL5fU9FBD4zBgIoXnKRRUc";
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces pour l'état du jeu
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
  items: Record<string, GameItem>;
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
    const newSocket = io("http://localhost:3000", {
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
      
      // Simulation locale des couleurs et des items
      const playerColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#8B5CF6', '#D946EF', '#F97316', '#0EA5E9'];
      const randomColor = playerColors[Math.floor(Math.random() * playerColors.length)];
      const worldSize = { width: 2000, height: 2000 };
      const randomItems = generateRandomItems(50, worldSize);
      
      // Mettre à jour l'état local pour notre joueur
      setGameState(prevState => ({
        ...prevState,
        items: randomItems,
        worldSize
      }));
      
      toast.success("Vous avez rejoint la partie");
    });
    
    newSocket.on("update_players", (players: Record<string, ServerPlayer>) => {
      console.log("Players update:", players);
      
      // Combiner les données du serveur avec nos données locales
      setGameState(prevState => {
        const updatedPlayers: Record<string, ServerPlayer> = {};
        
        // Traiter tous les joueurs du serveur
        Object.entries(players).forEach(([id, serverPlayer]) => {
          const existingPlayer = prevState.players[id];
          
          // Si c'est notre joueur, conserver les segments locaux
          if (id === playerId) {
            updatedPlayers[id] = {
              ...serverPlayer,
              segments: existingPlayer?.segments || [],
              color: existingPlayer?.color || '#FF0000'
            };
          } else {
            // Pour les autres joueurs, conserver leur couleur s'ils en ont une
            updatedPlayers[id] = {
              ...serverPlayer,
              segments: existingPlayer?.segments || [],
              color: existingPlayer?.color || ('#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0'))
            };
          }
        });
        
        return {
          ...prevState,
          players: updatedPlayers
        };
      });
    });
    
    newSocket.emit("join_room");
    setSocket(newSocket);
  };
  
  const handleMove = (direction: { x: number; y: number }) => {
    if (socket && gameStarted && playerId) {
      const player = gameState.players[playerId];
      if (!player) return;
      
      // Vitesse de base
      const speed = 5;
      const newX = player.x + direction.x * speed;
      const newY = player.y + direction.y * speed;
      
      // Limites du monde
      const worldWidth = gameState.worldSize?.width || 2000;
      const worldHeight = gameState.worldSize?.height || 2000;
      const playerSize = 20;
      
      const boundedX = Math.max(playerSize, Math.min(worldWidth - playerSize, newX));
      const boundedY = Math.max(playerSize, Math.min(worldHeight - playerSize, newY));
      
      // Envoyer la position au serveur
      socket.emit("move", { x: boundedX, y: boundedY });
      
      // Mise à jour locale pour une réponse immédiate
      setGameState(prevState => {
        const currentPlayer = prevState.players[playerId];
        if (!currentPlayer) return prevState;
        
        // Mettre à jour les segments si le joueur en a
        let newSegments = [...(currentPlayer.segments || [])];
        if (newSegments.length > 0) {
          // Déplacer tous les segments
          const firstSegPos = { x: currentPlayer.x, y: currentPlayer.y };
          for (let i = newSegments.length - 1; i > 0; i--) {
            newSegments[i] = { ...newSegments[i - 1] };
          }
          // Le premier segment prend la position actuelle du joueur
          newSegments[0] = firstSegPos;
        }
        
        // Vérifier les collisions avec les items (simulation locale)
        const itemsToRemove: string[] = [];
        Object.entries(prevState.items).forEach(([itemId, item]) => {
          const dx = boundedX - item.x;
          const dy = boundedY - item.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < playerSize) {
            // Collecter l'item
            itemsToRemove.push(itemId);
            
            // Ajouter un segment
            if (newSegments.length === 0) {
              // Premier segment à la position actuelle
              newSegments.push({ x: player.x, y: player.y });
            } else {
              // Nouveau segment à la position du dernier segment
              const lastSeg = newSegments[newSegments.length - 1];
              newSegments.push({ ...lastSeg });
            }
            
            toast.success("Item collecté !");
          }
        });
        
        // Supprimer les items collectés
        const updatedItems = { ...prevState.items };
        itemsToRemove.forEach(id => {
          delete updatedItems[id];
        });
        
        // Ajouter des nouveaux items si nécessaire
        if (itemsToRemove.length > 0) {
          const worldSize = prevState.worldSize || { width: 2000, height: 2000 };
          const itemColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5', '#FFD133', '#8F33FF'];
          
          itemsToRemove.forEach(() => {
            const newItemId = `item-${Date.now()}-${Math.random()}`;
            updatedItems[newItemId] = {
              id: newItemId,
              x: Math.random() * worldSize.width,
              y: Math.random() * worldSize.height,
              value: Math.floor(Math.random() * 5) + 1,
              color: itemColors[Math.floor(Math.random() * itemColors.length)]
            };
          });
        }
        
        return {
          ...prevState,
          items: updatedItems,
          players: {
            ...prevState.players,
            [playerId]: {
              ...currentPlayer,
              x: boundedX,
              y: boundedY,
              segments: newSegments
            }
          }
        };
      });
    }
  };
  
  const handleBoost = () => {
    if (socket && gameStarted) {
      // Votre serveur ne gère pas encore le boost
      // Mais nous pouvons l'ajouter localement
      if (playerId) {
        setGameState(prevState => {
          const player = prevState.players[playerId];
          if (!player) return prevState;
          
          return {
            ...prevState,
            players: {
              ...prevState.players,
              [playerId]: {
                ...player,
                boosting: true
              }
            }
          };
        });
        
        // Désactiver le boost après 3 secondes
        setTimeout(() => {
          setGameState(prevState => {
            const player = prevState.players[playerId];
            if (!player) return prevState;
            
            return {
              ...prevState,
              players: {
                ...prevState.players,
                [playerId]: {
                  ...player,
                  boosting: false
                }
              }
            };
          });
        }, 3000);
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
              players: gameState.players,
              items: gameState.items,
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
