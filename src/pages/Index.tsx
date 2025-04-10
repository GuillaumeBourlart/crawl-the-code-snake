
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/hooks/use-user";
import GameCanvas from "@/components/GameCanvas";
import { GameState } from "@/types/game";
import { api } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { Joystick } from "react-joystick-component";
import { handleJoystickDirection } from "@/components/GameCanvas";

const Index = () => {
  const [gameId, setGameId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isSpectator, setIsSpectator] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userProfile } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate("/auth/sign-in");
    }
  }, [user, navigate]);

  const createGame = async () => {
    setIsCreating(true);
    try {
      const response = await api.post("/game/create");
      const { gameId } = response.data;
      setGameId(gameId);
      setIsSpectator(false);
      await joinGame(gameId);
    } catch (error) {
      toast({
        title: "Error creating game",
        description: "Failed to create a new game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinGame = async (gameId: string) => {
    setIsJoining(true);
    try {
      const response = await api.post(`/game/join/${gameId}`, {
        skin_id: userProfile?.skin_id || null,
      });
      const { playerId, gameState } = response.data;
      setPlayerId(playerId);
      setGameState(gameState);
      setIsSpectator(false);
    } catch (error: any) {
      toast({
        title: "Error joining game",
        description:
          error?.response?.data?.message ||
          "Failed to join the game. Please check the Game ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const spectateGame = async (gameId: string) => {
    setIsJoining(true);
    try {
      const response = await api.get(`/game/spectate/${gameId}`);
      setGameState(response.data);
      setPlayerId(null);
      setIsSpectator(true);
    } catch (error: any) {
      toast({
        title: "Error spectating game",
        description:
          error?.response?.data?.message ||
          "Failed to spectate the game. Please check the Game ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleMove = async (direction: { x: number; y: number }) => {
    if (!gameId || !playerId) return;
    try {
      await api.post(`/game/move/${gameId}/${playerId}`, direction);
      const response = await api.get(`/game/state/${gameId}`);
      setGameState(response.data);
    } catch (error) {
      toast({
        title: "Error moving",
        description: "Failed to send move. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBoostStart = async () => {
    if (!gameId || !playerId) return;
    try {
      await api.post(`/game/boost/start/${gameId}/${playerId}`);
    } catch (error) {
      toast({
        title: "Error starting boost",
        description: "Failed to start boost. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBoostStop = async () => {
    if (!gameId || !playerId) return;
    try {
      await api.post(`/game/boost/stop/${gameId}/${playerId}`);
    } catch (error) {
      toast({
        title: "Error stopping boost",
        description: "Failed to stop boost. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlayerCollision = (otherPlayerId: string) => {
    toast({
      title: "Collision!",
      description: `You collided with player ${otherPlayerId}!`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-lg font-semibold">SpaceSnake.io</h1>
          <nav>
            <Button variant="link" onClick={() => navigate("/skins")}>
              Skins
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 flex items-center justify-center">
            SpaceSnake.io
          </h1>
          <p className="text-gray-400 text-lg">
            Enter a Game ID to join, or create a new game!
          </p>
        </div>

        {!gameState ? (
          <div className="space-y-4 w-full max-w-md">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter Game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              />
              <Button
                isLoading={isJoining}
                onClick={() => spectateGame(gameId)}
              >
                Spectate
              </Button>
              <Button isLoading={isJoining} onClick={() => joinGame(gameId)}>
                Join Game
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              isLoading={isCreating}
              onClick={createGame}
            >
              Create New Game
            </Button>
          </div>
        ) : (
          <div className="w-full h-full">
            <GameCanvas
              gameState={gameState}
              playerId={playerId}
              onMove={handleMove}
              onBoostStart={handleBoostStart}
              onBoostStop={handleBoostStop}
              onPlayerCollision={handlePlayerCollision}
              isSpectator={isSpectator}
            />
            {isMobile && (
              <div className="absolute bottom-4 left-4">
                <Joystick
                  size={100}
                  baseColor="#444"
                  stickColor="#888"
                  move={async (data) => {
                    const x = data.vector.x / 50;
                    const y = data.vector.y / 50;
                    handleJoystickDirection({ x, y });
                    if (x !== 0 || y !== 0) {
                      await handleMove({ x, y });
                    }
                  }}
                  stop={() => {
                    handleJoystickDirection({ x: 0, y: 0 });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-gray-400 text-center p-4">
        <p>&copy; {new Date().getFullYear()} SpaceSnake.io</p>
      </footer>
    </div>
  );
};

export default Index;
