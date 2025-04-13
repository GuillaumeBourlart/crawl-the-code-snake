
import { useState, useEffect } from 'react';
import { toast } from "sonner";

interface GlobalLeaderboardEntry {
  id: string;
  score: number;
  pseudo?: string;
}

// Données de fallback à utiliser si le serveur n'est pas accessible
const FALLBACK_LEADERBOARD: GlobalLeaderboardEntry[] = [
  { id: '1', pseudo: 'Joueur 1', score: 1200 },
  { id: '2', pseudo: 'Joueur 2', score: 1050 },
  { id: '3', pseudo: 'Joueur 3', score: 950 },
  { id: '4', pseudo: 'Joueur 4', score: 820 },
  { id: '5', pseudo: 'Joueur 5', score: 780 },
];

export function useGlobalLeaderboard(socketUrl: string) {
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usesFallback, setUsesFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    async function fetchLeaderboard() {
      try {
        setIsLoading(true);
        // Utiliser l'URL fournie
        const url = `${socketUrl}/globalLeaderboard`;
        
        console.log("Fetching global leaderboard from:", url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch global leaderboard: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          console.log("Global leaderboard data received:", data);
          setLeaderboard(data);
          setError(null);
          setUsesFallback(false);
        }
      } catch (err) {
        console.error('Error fetching global leaderboard:', err);
        
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(err instanceof Error ? err : new Error(String(err)));
          
          // Si nous avons épuisé nos tentatives, utiliser les données de fallback
          if (retryCount >= maxRetries) {
            console.log('Using fallback leaderboard data after failed attempts');
            setLeaderboard(FALLBACK_LEADERBOARD);
            setUsesFallback(true);
            toast.info("Impossible de charger le classement global. Utilisation des données locales.");
          } else if (isMounted) {
            // Sinon, réessayer après un délai
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
            console.log(`Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
            setTimeout(fetchLeaderboard, delay);
            return; // Ne pas définir isLoading à false pour continuer à afficher le loader
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLeaderboard();
    
    // Rafraîchir toutes les 60 secondes
    const intervalId = setInterval(fetchLeaderboard, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [socketUrl]);

  return { leaderboard, isLoading, error, usesFallback };
}
