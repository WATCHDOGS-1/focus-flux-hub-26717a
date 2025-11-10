import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

interface PresenceState {
  [userId: string]: {
    status: 'focusing' | 'break' | 'online' | 'offline';
    last_seen: number;
  };
}

const SHARED_FOCUS_ROOM_ID = "global-focus-room";

export function usePresence(currentStatus: 'focusing' | 'break' | 'online' = 'online') {
  const { userId, isAuthenticated } = useAuth();
  const [presenceState, setPresenceState] = useState<PresenceState>({});

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const channel = supabase.channel(SHARED_FOCUS_ROOM_ID, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    const handlePresence = (state: any) => {
      const newPresenceState: PresenceState = {};
      for (const id in state) {
        const userPresence = state[id][0];
        newPresenceState[id] = {
          status: userPresence.status || 'online',
          last_seen: userPresence.last_seen || Date.now(),
        };
      }
      setPresenceState(newPresenceState);
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        handlePresence(channel.presenceState());
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        handlePresence(channel.presenceState());
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        handlePresence(channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track initial status
          await channel.track({ 
            userId: userId, 
            status: currentStatus, 
            last_seen: Date.now() 
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId, isAuthenticated, currentStatus]);

  return presenceState;
}

// Component to display status dot
export const StatusDot = ({ status }: { status: 'focusing' | 'break' | 'online' | 'offline' }) => {
  let colorClass = "bg-gray-400";
  let tooltipText = "Offline";

  switch (status) {
    case 'focusing':
      colorClass = "bg-red-500 animate-pulse";
      tooltipText = "Focusing";
      break;
    case 'break':
      colorClass = "bg-yellow-500";
      tooltipText = "On Break";
      break;
    case 'online':
      colorClass = "bg-green-500";
      tooltipText = "Online";
      break;
    case 'offline':
    default:
      colorClass = "bg-gray-400";
      tooltipText = "Offline";
      break;
  }

  return (
    <div className={`w-2 h-2 rounded-full ${colorClass}`} title={tooltipText} />
  );
};