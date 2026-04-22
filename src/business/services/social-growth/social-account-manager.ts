import { supabase } from '@/lib/supabase-client';
import { PostgrestError } from '@supabase/supabase-js';

export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok';

export interface SocialAccount {
  id: string;
  business_id: string;
  platform: SocialPlatform;
  account_handle: string;
  account_name: string | null;
  profile_image_url: string | null;
  follower_count: number;
  engagement_rate: number;
  is_active: boolean;
  connected_at: string;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectAccountInput {
  business_id: string;
  platform: SocialPlatform;
  account_handle: string;
  account_name: string;
  profile_image_url?: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  follower_count?: number;
}

export class SocialAccountManager {
  static async connectAccount(input: ConnectAccountInput): Promise<SocialAccount> {
    const { data: existing } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('business_id', input.business_id)
      .eq('platform', input.platform)
      .eq('account_handle', input.account_handle)
      .single();

    if (existing) {
      throw new Error(`Account ${input.account_handle} is already connected`);
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .insert([{
        business_id: input.business_id,
        platform: input.platform,
        account_handle: input.account_handle,
        account_name: input.account_name,
        profile_image_url: input.profile_image_url || null,
        access_token: input.access_token,
        refresh_token: input.refresh_token || null,
        token_expires_at: input.token_expires_at || null,
        follower_count: input.follower_count || 0,
        engagement_rate: 0,
        is_active: true,
        connected_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to connect account: ${error.message}`);
    return data;
  }

  static async getBusinessAccounts(business_id: string): Promise<SocialAccount[]> {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('business_id', business_id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
    return data || [];
  }

  static async disconnectAccount(id: string, business_id: string): Promise<void> {
    const { error } = await supabase
      .from('social_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('business_id', business_id);

    if (error) throw new Error(`Failed to disconnect account: ${error.message}`);
  }

  static async deleteAccount(id: string, business_id: string): Promise<void> {
    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', id)
      .eq('business_id', business_id);

    if (error) throw new Error(`Failed to delete account: ${error.message}`);
  }

  static async syncAccountMetrics(
    id: string,
    business_id: string,
    metrics: { follower_count: number; engagement_rate: number }
  ): Promise<SocialAccount> {
    const { data, error } = await supabase
      .from('social_accounts')
      .update({
        follower_count: metrics.follower_count,
        engagement_rate: metrics.engagement_rate,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('business_id', business_id)
      .select()
      .single();

    if (error) throw new Error(`Failed to sync metrics: ${error.message}`);
    return data;
  }
}
