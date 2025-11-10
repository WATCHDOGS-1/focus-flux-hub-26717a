import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserLevels = Database["public"]["Tables"]["user_levels"]["Row"];

interface UserTitles {
  [userId: string]: string; // Maps user ID to title
}

export function useUserTitles(userIds: string[]): UserTitles {
  const [titles, setTitles] = useState<UserTitles>({});

  useEffect(() => {
    if (userIds.length === 0) {
      setTitles({});
      return;
    }

    const fetchTitles = async () => {
      const uniqueUserIds = Array.from(new Set(userIds));
      
      const { data, error } = await supabase
        .from("user_levels")
        .select("user_id, title")
        .in("user_id", uniqueUserIds);

      if (error) {
        console.error("Error fetching user titles:", error);
        return;
      }

      const newTitles: UserTitles = {};
      data.forEach((level: Pick<UserLevels, 'user_id' | 'title'>) => {
        newTitles[level.user_id] = level.title;
      });
      setTitles(newTitles);
    };

    fetchTitles();
  }, [userIds]);

  return titles;
}