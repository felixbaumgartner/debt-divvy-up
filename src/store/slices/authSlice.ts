
import { StateCreator } from 'zustand';
import { AppState, AuthSlice } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const createAuthSlice: StateCreator<
  AppState,
  [],
  [],
  AuthSlice
> = (set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
});
