
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGlobalLeaderboard } from "@/hooks/use-leaderboard";
import { Card } from "./ui/card";

interface GlobalLeaderboardDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalLeaderboardDialog = ({ isOpen, onClose }: GlobalLeaderboardDialogProps) => {
  const { leaderboard, isLoading, error, usesFallback } = useGlobalLeaderboard("https://api.grubz.io");
  
  // Limiter aux 10 meilleurs scores
  const topTenScores = leaderboard.slice(0, 10);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-700/50 text-white backdrop-blur-lg">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <DialogTitle className="text-center text-lg">Top 10 Global</DialogTitle>
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-4">
            Impossible de charger le classement
            {usesFallback && <div className="text-xs text-gray-400 mt-1">(Données locales)</div>}
          </div>
        ) : (
          <Card className="bg-gray-800/70 border-gray-700/40">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700/30 hover:bg-gray-700/30">
                  <TableHead className="w-10 text-gray-400">Rang</TableHead>
                  <TableHead className="text-gray-400">Joueur</TableHead>
                  <TableHead className="text-right text-gray-400">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTenScores.length > 0 ? (
                  topTenScores.map((player, index) => (
                    <TableRow key={player.id} className="border-gray-700/20 hover:bg-gray-700/30">
                      <TableCell className="font-medium w-10">
                        {index === 0 ? (
                          <span className="text-yellow-400">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-gray-300">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-amber-700">🥉</span>
                        ) : (
                          index + 1
                        )}
                      </TableCell>
                      <TableCell>{player.pseudo || `Joueur ${index + 1}`}</TableCell>
                      <TableCell className="text-right">{player.score}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 py-4">
                      Aucun joueur dans le classement
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalLeaderboardDialog;
