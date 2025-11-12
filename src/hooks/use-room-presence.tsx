import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREDEFINED_ROOMS } from "@/utils/constants";

interface RoomPresence {
  [roomId: string]: number;
}

/**
 * Tracks the number of users present in each predefined room using Supabase Presence.
 */
export function useRoomPresence(): RoomPresence {
  const [presence, setPresence] = useState<RoomPresence>({});
  const roomChannels = PREDEFINED_ROOMS.map(room => `room:${room.id}`);

  useEffect(() => {
    const channels = roomChannels.map(channelName => {
      const roomId = channelName.split(':')[1];
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: 'user_id_placeholder', // Key is required but value doesn't matter for counting
          }
        }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setPresence(prev => ({ ...prev, [roomId]: count }));
        })
        .on('presence', { event: 'join' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setPresence(prev => ({ ...prev, [roomId]: count }));
        })
        .on('presence', { event: 'leave' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          setPresence(prev => ({ ...prev, [roomId]: count }));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Initial sync will happen automatically
          }
        });
      
      return channel;
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  return presence;
}