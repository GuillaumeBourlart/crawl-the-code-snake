
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
interface Player {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  direction: { x: number; y: number };
  segments: Array<{ x: number; y: number }>;
  boosting: boolean;
}

interface GameItem {
  id: string;
  x: number;
  y: number;
  value: number;
}

interface GameState {
  players: Record<string, Player>;
  items: Record<string, GameItem>;
  worldSize: { width: number; height: number };
}

const Index = () => {
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    players: {},
    items: {},
    worldSize: { width: 2000, height: 2000 }
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Créer une salle par défaut si aucune n'existe
  const createDefaultRoom = async () => {
    try {
      const { data: existingRooms, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .limit(1);
      
      if (roomError) {
        console.error("Error checking for rooms:", roomError);
        return;
      }
      
      if (!existingRooms || existingRooms.length === 0) {
        const { data, error } = await supabase
          .from("rooms")
          .insert([
            { 
              name: "Default Room", 
              max_players: 25,
              current_players: 0
            }
          ])
          .select();
        
        if (error) {
          console.error("Error creating default room:", error);
          return;
        }
        
        console.log("Created default room:", data);
        return data[0];
      }
      
      return existingRooms[0];
    } catch (error) {
      console.error("Error in createDefaultRoom:", error);
    }
  };

  useEffect(() => {
    // Fetch rooms from Supabase
    const fetchRooms = async () => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching rooms:", error);
          return;
        }
        
        if (!data || data.length === 0) {
          // Créer une salle par défaut si aucune n'existe
          const defaultRoom = await createDefaultRoom();
          if (defaultRoom) {
            setRooms([defaultRoom]);
            setSelectedRoom(defaultRoom.id);
          }
        } else {
          setRooms(data);
          setSelectedRoom(data[0].id);
        }
      } catch (error) {
        console.error("Error in fetchRooms:", error);
      }
    };
    
    // Établir la connexion socket une seule fois
    const setupSocketConnection = () => {
      if (socket) return; // Ne pas réinitialiser si déjà initialisé
      
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
        toast.error("Déconnecté du serveur");
      });
      
      newSocket.on("gameState", (state: GameState) => {
        setGameState(state);
      });
      
      newSocket.on("joined", (data: { playerId: string }) => {
        console.log("Joined game as player:", data.playerId);
        setPlayerId(data.playerId);
        setGameStarted(true);
        toast.success("Vous avez rejoint la partie");
      });
      
      newSocket.on("died", () => {
        console.log("You died!");
        setGameStarted(false);
        toast.error("Vous êtes mort!");
      });
      
      setSocket(newSocket);
    };
    
    fetchRooms();
    setupSocketConnection();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);
  
  const handlePlay = () => {
    if (!connected) {
      setConnecting(true);
      // Tenter de se reconnecter
      if (socket) {
        socket.connect();
      }
      
      // Vérifier si nous avons des salles
      if (rooms.length === 0) {
        createDefaultRoom().then(fetchRooms);
      }
      return;
    }
    
    if (socket && connected && selectedRoom) {
      setConnecting(true);
      const playerName = `Player_${Math.floor(Math.random() * 1000)}`;
      const playerColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      
      socket.emit("joinRoom", {
        roomId: selectedRoom,
        playerName,
        playerColor
      });
      
      // Réinitialiser le statut de connexion après un délai si nous n'avons pas rejoint
      setTimeout(() => {
        setConnecting(false);
      }, 5000);
    }
  };
  
  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching rooms:", error);
      return;
    }
    
    setRooms(data || []);
    if (data && data.length > 0) {
      setSelectedRoom(data[0].id);
    }
  };
  
  const handleMove = (direction: { x: number; y: number }) => {
    if (socket && gameStarted && playerId) {
      socket.emit("move", { direction });
    }
  };
  
  const handleBoost = () => {
    if (socket && gameStarted && playerId) {
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
            disabled={connecting || (connected && !selectedRoom)}
          >
            {connecting ? "Connexion..." : connected ? "JOUER" : "SE CONNECTER"}
          </Button>
          
          {rooms.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">Salles disponibles:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedRoom === room.id 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    {room.name} ({room.current_players}/{room.max_players})
                  </button>
                ))}
              </div>
            </div>
          )}
          
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
            gameState={gameState} 
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
