
import { useState, useEffect } from 'react';

interface GlobalLeaderboardEntry {
  id: string;
  score: number;
  pseudo?: string;
}

export function useGlobalLeaderboard(socketUrl: string) {
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);
        // Utiliser directement l'URL du serveur au lieu d'essayer de la dériver de socketUrl
        const baseUrl = "https://codecrawl-production.up.railway.app";
        const response = await fetch(`${baseUrl}/globalLeaderboard`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch global leaderboard: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setLeaderboard(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching global leaderboard:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    }

    if (socketUrl) {
      fetchLeaderboard();
      
      // Rafraîchir toutes les 30 secondes
      const intervalId = setInterval(fetchLeaderboard, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [socketUrl]);

  return { leaderboard, isLoading, error };
}
