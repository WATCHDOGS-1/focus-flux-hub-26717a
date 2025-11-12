import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Mock type definitions for peer data needed for ranking
interface PeerRankingData {
  userId: string;
  totalFocusedMinutes: number;
  currentStreak: number; // Days
  lastSessionMinutes: number;
}

interface OptimizationResult {
  maxVideosToLoad: number;
  rankedPeerIds: string[];
}

/**
 * [MOCK] Simulates a real-time bandwidth check to determine network capacity.
 * In a production environment, this would involve a small data transfer test.
 * @returns Estimated download bandwidth in Mbps.
 */
const checkBandwidth = async (): Promise<number> => {
  // Simulate network latency and return a plausible bandwidth value
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  // Return a value between 5 Mbps (low) and 50 Mbps (high)
  const simulatedMbps = 5 + Math.random() * 45;
  return parseFloat(simulatedMbps.toFixed(1));
};

/**
 * Determines the maximum number of video streams a user can handle based on bandwidth.
 * Assumes 1.5 Mbps per high-quality video stream.
 * @param bandwidthMbps Current estimated download bandwidth.
 * @returns Maximum number of videos to load.
 */
const calculateMaxVideos = (bandwidthMbps: number): number => {
  const MIN_VIDEOS = 1; // Always show at least the local user + 1 remote peer
  const MAX_VIDEOS = 8; // Hard cap for performance reasons
  const MBPS_PER_STREAM = 1.5; 

  // Calculate theoretical max streams (excluding local user)
  const theoreticalMax = Math.floor(bandwidthMbps / MBPS_PER_STREAM);
  
  return Math.min(MAX_VIDEOS, Math.max(MIN_VIDEOS, theoreticalMax));
};


/**
 * The Star Peer Ranking Algorithm: Ranks peers based on focus metrics.
 * This prioritizes peers who are actively engaged and have strong historical focus habits.
 * 
 * Ranking Score = (Total Focused Minutes * 0.01) + (Current Streak * 5) + (Last Session Minutes * 0.5)
 * 
 * @param allPeersData Array of peer data including focus metrics.
 * @returns Array of user IDs ranked from highest to lowest score.
 */
const starPeerRanking = (allPeersData: PeerRankingData[]): string[] => {
  const rankedPeers = allPeersData.map(peer => {
    const score = 
      (peer.totalFocusedMinutes * 0.01) + 
      (peer.currentStreak * 5) + 
      (peer.lastSessionMinutes * 0.5);
    
    return { userId: peer.userId, score };
  });

  rankedPeers.sort((a, b) => b.score - a.score);
  
  return rankedPeers.map(p => p.userId);
};


/**
 * Main optimization function. Fetches peer stats, checks bandwidth, and returns 
 * the prioritized list of peers to display video for.
 * 
 * NOTE: In a real implementation, `allPeerIds` would be used to fetch real stats 
 * from the `user_stats` table. For this utility, we use mock data for demonstration.
 */
export const getOptimizedPeerList = async (allPeerIds: string[]): Promise<OptimizationResult> => {
  // 1. Check Bandwidth
  const bandwidth = await checkBandwidth();
  const maxVideosToLoad = calculateMaxVideos(bandwidth);

  // 2. [MOCK DATA] Simulate fetching peer stats for ranking
  const mockPeerStats: PeerRankingData[] = allPeerIds.map(id => ({
    userId: id,
    totalFocusedMinutes: Math.floor(Math.random() * 5000),
    currentStreak: Math.floor(Math.random() * 30),
    lastSessionMinutes: Math.floor(Math.random() * 120),
  }));

  // 3. Apply Star Ranking Algorithm
  const rankedPeerIds = starPeerRanking(mockPeerStats);

  // 4. Return the top N peers based on bandwidth limit
  return {
    maxVideosToLoad,
    rankedPeerIds: rankedPeerIds.slice(0, maxVideosToLoad),
  };
};