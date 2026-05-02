import { useQuery } from '@tanstack/react-query';

export type Me = {
  id: number;
  spotify_id: string;
  display_name: string | null;
};

export const useMe = () =>
  useQuery<Me | null>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`me failed: ${res.status}`);
      return (await res.json()) as Me;
    },
    retry: false,
    staleTime: 60_000,
  });
