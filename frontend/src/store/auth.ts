import { create } from 'zustand';
import { getCurrentUser, signOut, signIn } from 'aws-amplify/auth';

interface AuthUser {
  email: string;
  username: string;
  userId: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      set({
        user: {
          email: user.signInDetails?.loginId || '',
          username: user.username || '',
          userId: user.userId || '',
        },
        isAuthenticated: true,
      });
    } catch (error) {
      console.log('No authenticated user:', error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      await signIn({ username: email, password });
      set((state) => ({
        ...state,
        isLoading: false,
      }));
      // Fetch current user after successful sign-in
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Call getCurrentUser to update state
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ isLoading: false });
      throw error;
    }
  },
}));
