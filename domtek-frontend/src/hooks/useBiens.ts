import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Bien, PaginatedResponse } from '@/types';

export function useBiens(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['biens', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Bien>>('/biens', { params: filters });
      return data;
    },
  });
}

export function useBien(id: number) {
  return useQuery({
    queryKey: ['biens', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Bien }>(`/biens/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData | Partial<Bien>) =>
      api.post('/biens', formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['biens'] }),
  });
}

export function useUpdateBien(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Bien>) => api.put(`/biens/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biens'] });
      queryClient.invalidateQueries({ queryKey: ['biens', id] });
    },
  });
}

export function useDeleteBien() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/biens/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['biens'] }),
  });
}

export function useUploadBienImages(bienId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/biens/${bienId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['biens', bienId] }),
  });
}
