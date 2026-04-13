import { useAuthStore } from '@/store/authStore';

/**
 * Transforme un chemin /dashboard/xxx en /{slug}/xxx.
 * Utilise getState() de Zustand (pas un hook) → utilisable partout.
 */
export function orgPath(path: string): string {
  const slug = useAuthStore.getState().organisation?.slug ?? 'dashboard';
  return path.replace('/dashboard', `/${slug}`);
}
