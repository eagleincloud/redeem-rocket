import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import * as SupabaseService from '@/lib/supabase-service';

/**
 * useSupabase - Custom hook for managing Supabase auth and data state
 * Replaces localStorage-based auth with Supabase sessions
 */

export interface UseSupabaseState {
  user: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useSupabase() {
  const [state, setState] = useState<UseSupabaseState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // Check if there's an existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted) {
          setState({
            user: session?.user || null,
            loading: false,
            error: null,
            isAuthenticated: !!session?.user,
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            user: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Auth initialization failed',
            isAuthenticated: false,
          });
        }
      }
    }

    initAuth();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setState({
          user: session?.user || null,
          loading: false,
          error: null,
          isAuthenticated: !!session?.user,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Auth methods
  const signUp = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await SupabaseService.signUp(email, password);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign up failed';
      setState((s) => ({ ...s, error: errorMsg }));
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await SupabaseService.signIn(email, password);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign in failed';
      setState((s) => ({ ...s, error: errorMsg }));
      throw err;
    }
  };

  const signOut = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await SupabaseService.signOut();
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sign out failed';
      setState((s) => ({ ...s, error: errorMsg }));
      throw err;
    }
  };

  return {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,

    // Methods
    signUp,
    signIn,
    signOut,
  };
}
