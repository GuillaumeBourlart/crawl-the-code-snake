
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "./use-auth";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
  skin_id: number | null;
  available_skins: number[];
}

export function useUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async (): Promise<UserProfile> => {
      if (!user) throw new Error("User not authenticated");
      const response = await api.get(`/user/profile/${user.id}`);
      return response.data;
    },
    enabled: !!user,
  });
}
