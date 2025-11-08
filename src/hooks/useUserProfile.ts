import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useUserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        navigate('/auth');
        setLoading(false);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = 'No rows found'
        toast.error("Could not fetch your profile. Please refresh.");
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        const newUsername = currentUser.user_metadata?.full_name || `user_${currentUser.id.slice(0, 6)}`;
        const newAvatarUrl = currentUser.user_metadata?.avatar_url || null;

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            username: newUsername,
            profile_photo_url: newAvatarUrl,
          })
          .select()
          .single();

        if (createError) {
          toast.error("Failed to create your user profile.");
          console.error('Error creating profile:', createError);
        } else {
          setProfile(newProfile);
          toast.success("Welcome! Your profile has been created.");
        }
      }
      setLoading(false);
    };

    fetchUserAndProfile();
  }, [navigate]);

  return { user, profile, loading };
}