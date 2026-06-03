import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  is_default: boolean;
}

export function useProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (data) setProfiles(data as UserProfile[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const addProfile = useCallback(
    async (name: string, avatarUrl?: string) => {
      if (!user) return;
      const { error } = await supabase.from("user_profiles").insert({
        user_id: user.id,
        name,
        avatar_url: avatarUrl || null,
        is_default: profiles.length === 0,
      });
      if (error) throw error;
      await fetchProfiles();
    },
    [user, profiles.length, fetchProfiles]
  );

  const removeProfile = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from("user_profiles").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      await fetchProfiles();
    },
    [user, fetchProfiles]
  );

  const updateProfile = useCallback(
    async (id: string, patch: Partial<Pick<UserProfile, "name" | "avatar_url">>) => {
      if (!user) return;
      const { error } = await supabase.from("user_profiles").update(patch).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      await fetchProfiles();
    },
    [user, fetchProfiles]
  );

  return { profiles, loading, addProfile, removeProfile, updateProfile };
}
