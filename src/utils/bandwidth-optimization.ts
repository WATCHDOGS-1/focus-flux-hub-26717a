import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface PeerRankingData {
  userId: string;
  totalFocusedMinutes: number;
  currentStreak: number;
  lastSessionMinutes: number;
}

interface OptimizationResult {
  maxVideosToLoad: number;
  rankedPeerIds: string[];
}

/**
 * Estimates the user's current network throughput for video streaming.
 * @returns Estimated download bandwidth in Mbps.
 */
const estimateBandwidth = async (): Promise<number> => {
  // Placeholder for WebRTC data channel throughput test
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  const estimatedMbps = 5 + Math.random() * 45;
  return parseFloat(estimatedMbps.toFixed(1));
};

/**
 * Determines the maximum number of video streams a user can handle based on bandwidth.
 * Assumes 1.5 Mbps per high-quality video stream.
 * @param bandwidthMbps Current estimated download bandwidth.
 * @returns Maximum number of videos to load.
 */
const calculateMaxVideos = (bandwidthMbps: number): number => {
  const MIN_VIDEOS = 1;
  const MAX_VIDEOS = 8;
  const MBPS_PER_STREAM = 1.5; 

  const theoreticalMax = Math.floor(bandwidthMbps / MBPS_PER_STREAM);
  
  return Math.min(MAX_VIDEOS, Math.max(MIN_VIDEOS, theoreticalMax));
};


/**
 * The Star Peer Ranking Algorithm: Ranks peers based on focus metrics.
 * Prioritizes peers who are actively engaged and have strong historical focus habits.
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
 * Retrieves focus metrics for all active peers.
 */
const __fetchPeerStats = async (allPeerIds: string[]): Promise<PeerRankingData[]> => {
  
  // Simulate network delay for data retrieval
  await new Promise(resolve => setTimeout(resolve, 100)); 

  const _peerStats: PeerRankingData[] = allPeerIds.map(id => ({
    userId: id,
    totalFocusedMinutes: Math.floor(Math.random() * 5000),
    currentStreak: Math.floor(Math.random() * 30),
    lastSessionMinutes: Math.floor(Math.random() * 120),
  }));
  
  return _peerStats;
}


/**
 * Main optimization function. Checks bandwidth, ranks peers, and returns 
 * the prioritized list of peers to display video for.
 */
export const getOptimizedPeerList = async (allPeerIds: string[]): Promise<OptimizationResult> => {
  // 1. Estimate current network capacity
  const bandwidth = await estimateBandwidth();
  const maxVideosToLoad = calculateMaxVideos(bandwidth);

  // 2. Retrieve peer focus metrics
  const peerStats = await __fetchPeerStats(allPeerIds);

  // 3. Apply Star Ranking Algorithm to prioritize high-focus peers
  const rankedPeerIds = starPeerRanking(peerStats);

  // 4. Return the top N peers based on bandwidth limit
  return {
    maxVideosToLoad,
    rankedPeerIds: rankedPeerIds.slice(0, maxVideosToLoad),
  };
};