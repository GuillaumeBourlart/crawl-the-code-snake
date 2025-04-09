
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
        // Remplacer la partie URL par l'URL complète du socketUrl
        const baseUrl = socketUrl.replace(/\/socket\.io.*$/, '').replace('wss://', 'https://');
        const response = await fetch(`${baseUrl}/globalLeaderboard`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch global leaderboard');
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
