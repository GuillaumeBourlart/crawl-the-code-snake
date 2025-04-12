import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GameCanvas from "@/components/GameCanvas";
import { io } from "socket.io-client";
import MobileControls from "@/components/MobileControls";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import GameOverDialog from "@/components/GameOverDialog";
import { Trophy, User, ArrowRight, Settings, Palette, LogOut, Play } from "lucide-react";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import { useGlobalLeaderboard } from "@/hooks/use-leaderboard";
import PlayerScore from "@/components/PlayerScore";
import { useAuth } from "@/hooks/use-auth";
import { useSkins } from "@/hooks/use-skins";
import SkinPreview from "@/components/SkinPreview";
import { Link } from "react-router-dom";
import AuthButtons from "@/components/AuthButtons";
import ZigzagTitle from "@/components/ZigzagTitle";
import AnimatedArrow from "@/components/AnimatedArrow";
import Footer from "@/components/Footer";

const SOCKET_SERVER_URL = "wss://grubz.io";

interface ServerPlayer {
  id?: string;
  x: number;
  y: number;
  length?: number;
  color?: string;
  direction?: { x: number; y: number };
  queue?: Array<{ x: number; y: number; color?: string }>;
  boosting?: boolean;
  itemEatenCount?: number;
  pseudo?: string;
  spectator?: boolean;
  skin_id?: number | null;
}

interface GameItem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  radius?: number;
}

interface ServerGameState {
  players: Record<string, ServerPlayer>;
  items?: Record<string, GameItem> | GameItem[];
  worldSize?: { width: number; height: number };
}

interface PlayerLeaderboardEntry {
  id: string;
  score: number;
  color: string;
  pseudo?: string;
}

const MAX_RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 2000;

const MIN_ITEM_RADIUS = 4;
const MAX_ITEM_RADIUS = 10;
const DEFAULT_ITEM_EATEN_COUNT = 18;

const Index = () => {
  // ... keep existing component implementation
};

export default Index;
