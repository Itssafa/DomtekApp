import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Employe, PaginatedResponse } from '@/types';

export function useEmployes(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['employes', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Employe>>('/employes', { params: filters });
      return data;
    },
  });
}

export function useEmploye(id: number) {
  return useQuery({
    queryKey: ['employes', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: Employe }>(`/employes/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEmploye() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Employe>) => api.post('/employes', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employes'] }),
  });
}

export function useUpdateEmploye(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Employe>) => api.put(`/employes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      queryClient.invalidateQueries({ queryKey: ['employes', id] });
    },
  });
}

export function useDeleteEmploye() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/employes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employes'] }),
  });
}
