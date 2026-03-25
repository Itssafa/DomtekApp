import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Contrat, PaginatedResponse } from '@/types';

export function useContrats(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['contrats', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Contrat>>('/contrats', { params: filters });
      return data;
    },
  });
}

export function useContrat(id: number) {
  return useQuery({
    queryKey: ['contrats', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Contrat }>(`/contrats/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateContrat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contrat>) => api.post('/contrats', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['biens'] }); // bien statut changes
    },
  });
}

export function useUpdateContrat(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contrat>) => api.put(`/contrats/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrats'] });
      queryClient.invalidateQueries({ queryKey: ['contrats', id] });
      queryClient.invalidateQueries({ queryKey: ['biens'] });
    },
  });
}

export function useDeleteContrat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/contrats/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contrats'] }),
  });
}
