import { supabase } from './supabase-client';

/**
 * Supabase Service - CRUD operations for customer app
 * Handles authentication and data queries
 */

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// ─────────────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS DATA
// ─────────────────────────────────────────────────────────────────────────────

export async function getBusinessData(userId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Business might not exist yet (during onboarding)
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }
  return data;
}

export async function createBusiness(userId: string, businessData: any) {
  const { data, error } = await supabase
    .from('businesses')
    .insert([
      {
        user_id: userId,
        ...businessData,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateBusiness(userId: string, businessData: any) {
  const { data, error } = await supabase
    .from('businesses')
    .update(businessData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING STATE
// ─────────────────────────────────────────────────────────────────────────────

export async function getOnboardingState(userId: string) {
  const { data, error } = await supabase
    .from('onboarding_state')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Might not exist yet
  if (error?.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data;
}

export async function saveOnboardingState(userId: string, state: any) {
  const existingState = await getOnboardingState(userId);

  if (existingState) {
    // Update existing
    const { data, error } = await supabase
      .from('onboarding_state')
      .update(state)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from('onboarding_state')
      .insert([
        {
          user_id: userId,
          ...state,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export async function waitForAuth(maxWait = 5000) {
  /**
   * Wait for auth to be initialized
   * Useful on page load when Supabase is still checking session
   */
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session !== null || Date.now() - startTime > maxWait) {
      return session;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export function onAuthChange(callback: (user: any) => void) {
  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}
