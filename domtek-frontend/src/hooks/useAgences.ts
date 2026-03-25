import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Organisation, PaginatedResponse } from '@/types';

export function useAgences() {
  return useQuery({
    queryKey: ['agences'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Organisation>>('/agences');
      return data;
    },
  });
}

export function useAgence(slug: string) {
  return useQuery({
    queryKey: ['agences', slug],
    queryFn: async () => {
      const { data } = await api.get<{ data: Organisation }>(`/agences/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}
