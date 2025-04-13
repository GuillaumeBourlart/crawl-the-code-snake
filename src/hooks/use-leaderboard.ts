
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

// URL base pour l'API
const API_BASE_URL = "https://api.grubz.io";

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
        const url = `${API_BASE_URL}/globalLeaderboard`;
        
        console.log("Fetching global leaderboard from:", url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds
        
        const response = await fetch(url, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          mode: 'cors',
          credentials: 'omit' // Don't send cookies
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch global leaderboard: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (isMounted) {
          console.log("Global leaderboard data received:", data);
          setLeaderboard(Array.isArray(data) ? data : []);
          setError(null);
          setUsesFallback(false);
          
          // Reset loading state
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching global leaderboard:', err);
        
        if (isMounted) {
          // If we've exhausted our retries, use the fallback data
          if (retryCount >= maxRetries) {
            console.log('Using fallback leaderboard data after failed attempts');
            setLeaderboard(FALLBACK_LEADERBOARD);
            setUsesFallback(true);
            toast.error("Impossible de charger le classement global. Utilisation des données locales.");
            setIsLoading(false);
          } else {
            // Otherwise, retry after a delay
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff with max 10s
            console.log(`Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
            
            setTimeout(() => {
              if (isMounted) {
                fetchLeaderboard();
              }
            }, delay);
          }
          
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    fetchLeaderboard();
    
    // Refresh every 60 seconds
    const intervalId = setInterval(() => {
      if (isMounted) {
        retryCount = 0; // Reset retry count for periodic refreshes
        fetchLeaderboard();
      }
    }, 60000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { leaderboard, isLoading, error, usesFallback };
}
