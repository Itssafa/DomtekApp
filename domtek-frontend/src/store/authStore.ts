import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { User, Organisation, Role } from '@/types';
import { TOKEN_KEY } from '@/lib/api';

interface AuthState {
  user: User | null;
  organisation: Organisation | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User, role: Role, organisation?: Organisation) => void;
  clearAuth: () => void;
  updateOrganisation: (org: Organisation) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organisation: null,
      token: null,
      role: null,
      isAuthenticated: false,

      setAuth: (token, user, role, organisation) => {
        Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'Lax' });
        if (organisation?.slug) {
          Cookies.set('org-slug', organisation.slug, { expires: 7, sameSite: 'Lax' });
        }
        set({ token, user, role, organisation: organisation ?? null, isAuthenticated: true });
      },

      clearAuth: () => {
        Cookies.remove(TOKEN_KEY);
        Cookies.remove('org-slug');
        set({ token: null, user: null, role: null, organisation: null, isAuthenticated: false });
      },

      updateOrganisation: (org) => {
        set({ organisation: org });
      },
    }),
    {
      name: 'domtek-auth',
      partialize: (state) => ({
        user: state.user,
        organisation: state.organisation,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
