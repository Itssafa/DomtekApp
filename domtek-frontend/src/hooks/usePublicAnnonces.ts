import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Annonce, PaginatedResponse } from '@/types';

export function usePublicAnnonces(filters?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['public-annonces', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Annonce>>('/annonces', { params: filters });
      return data;
    },
  });
}

export function usePublicAnnonce(id: number) {
  return useQuery({
    queryKey: ['public-annonces', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Annonce }>(`/annonces/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}
