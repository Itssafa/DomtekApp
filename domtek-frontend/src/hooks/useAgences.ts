import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Organisation, PaginatedResponse } from '@/types';

export function useAgences() {
  return useQuery({
    queryKey: ['organisations'],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Organisation>>('/organisations');
      return data;
    },
  });
}

export function useAgence(slug: string) {
  return useQuery({
    queryKey: ['organisations', slug],
    queryFn: async () => {
      const { data } = await api.get<{ data: Organisation }>(`/organisations/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}
