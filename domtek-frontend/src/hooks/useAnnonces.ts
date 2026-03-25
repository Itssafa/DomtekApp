import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Annonce, PaginatedResponse } from '@/types';

export function useAnnonces(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['annonces', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Annonce>>('/annonces', { params: filters });
      return data;
    },
  });
}

export function useAnnonce(id: number) {
  return useQuery({
    queryKey: ['annonces', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Annonce }>(`/annonces/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAnnonce() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Annonce>) => api.post('/annonces', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annonces'] }),
  });
}

export function useUpdateAnnonce(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Annonce>) => api.put(`/annonces/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annonces'] });
      queryClient.invalidateQueries({ queryKey: ['annonces', id] });
    },
  });
}

export function useDeleteAnnonce() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/annonces/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annonces'] }),
  });
}

export function usePublierAnnonce() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/annonces/${id}/publier`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annonces'] }),
  });
}

export function useArchiverAnnonce() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch(`/annonces/${id}/archiver`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annonces'] }),
  });
}
