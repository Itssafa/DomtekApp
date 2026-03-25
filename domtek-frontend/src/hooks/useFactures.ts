import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Facture, PaginatedResponse } from '@/types';

export function useFactures(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['factures', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Facture>>('/factures', { params: filters });
      return data;
    },
  });
}

export function useFacture(id: number) {
  return useQuery({
    queryKey: ['factures', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Facture }>(`/factures/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Facture>) => api.post('/factures', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['factures'] }),
  });
}

export function useUpdateFacture(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Facture>) => api.put(`/factures/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['factures', id] });
    },
  });
}

export function useMarquerPayee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/factures/${id}/payer`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['factures'] }),
  });
}

export function useDeleteFacture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/factures/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['factures'] }),
  });
}
