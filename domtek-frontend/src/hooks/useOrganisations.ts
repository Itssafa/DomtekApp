import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Organisation, PaginatedResponse } from '@/types';

export function useOrganisations(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['organisations', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Organisation>>(
        '/admin/organisations',
        { params: filters }
      );
      return data;
    },
  });
}

export function useOrganisation(slug: string) {
  return useQuery({
    queryKey: ['organisations', slug],
    queryFn: async () => {
      const { data } = await api.get<{ data: Organisation }>(`/admin/organisations/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useActiverOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.patch(`/admin/organisations/${slug}/activer`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organisations'] }),
  });
}

export function useDesactiverOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.patch(`/admin/organisations/${slug}/desactiver`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organisations'] }),
  });
}

export function useDeleteOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => api.delete(`/admin/organisations/${slug}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organisations'] }),
  });
}
