import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, User } from '../api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, name: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateUser: (user: User) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });

                const result = await api.login(email, password);

                if (result.success && result.data) {
                    api.setToken(result.data.accessToken);
                    set({
                        user: result.data.user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return true;
                }

                set({ isLoading: false, error: result.error || 'Login failed' });
                return false;
            },

            register: async (email: string, password: string, name: string) => {
                set({ isLoading: true, error: null });

                const result = await api.register(email, password, name);

                if (result.success && result.data) {
                    api.setToken(result.data.accessToken);
                    set({
                        user: result.data.user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                    return true;
                }

                set({ isLoading: false, error: result.error || 'Registration failed' });
                return false;
            },

            logout: () => {
                api.setToken(null);
                set({ user: null, isAuthenticated: false });
            },

            checkAuth: async () => {
                const token = api.getToken();
                if (!token) {
                    set({ isAuthenticated: false, user: null });
                    return;
                }

                set({ isLoading: true });
                const result = await api.getMe();

                if (result.success && result.data) {
                    set({
                        user: result.data.user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } else {
                    api.setToken(null);
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },

            updateUser: (user: User) => {
                set({ user });
            },

            clearError: () => {
                set({ error: null });
            },
        }),
        {
            name: 'reelmind-auth',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
