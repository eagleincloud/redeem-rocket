import { supabase } from '@/lib/supabase-client';
import { PostgrestError } from '@supabase/supabase-js';

export interface SocialPost {
  id: string;
  business_id: string;
  social_account_id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok';
  content: string;
  media_urls: string[];
  hashtags: string[];
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  engagement_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_published: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  business_id: string;
  social_account_id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok';
  content: string;
  media_urls?: string[];
  hashtags?: string[];
  scheduled_at?: string;
}

export interface SchedulePostInput {
  post_id: string;
  business_id: string;
  scheduled_at: string;
}

export class SocialMediaManager {
  /**
   * Create a new social media post
   */
  static async createPost(input: CreatePostInput): Promise<SocialPost> {
    const { data, error } = await supabase
      .from('social_posts')
      .insert([{
        business_id: input.business_id,
        social_account_id: input.social_account_id,
        platform: input.platform,
        content: input.content,
        media_urls: input.media_urls || [],
        hashtags: input.hashtags || [],
        scheduled_at: input.scheduled_at || null,
        is_published: false,
        engagement_count: 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
      }])
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to create post');
    return data;
  }

  /**
   * Get posts for a business
   */
  static async getBusinessPosts(
    business_id: string,
    filters?: {
      platform?: string;
      is_published?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ posts: SocialPost[]; total: number }> {
    let query = supabase
      .from('social_posts')
      .select('*', { count: 'exact' })
      .eq('business_id', business_id);

    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    const { data, error, count } = await query;

    if (error) throw this.handleError(error, 'Failed to fetch posts');
    return { posts: data || [], total: count || 0 };
  }

  /**
   * Schedule a post for later publishing
   */
  static async schedulePost(input: SchedulePostInput): Promise<SocialPost> {
    const scheduledTime = new Date(input.scheduled_at);
    if (scheduledTime <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const { data, error } = await supabase
      .from('social_posts')
      .update({
        scheduled_at: input.scheduled_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.post_id)
      .eq('business_id', input.business_id)
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to schedule post');
    return data;
  }

  /**
   * Publish a post immediately
   */
  static async publishPost(
    post_id: string,
    business_id: string,
    platform_post_id: string
  ): Promise<SocialPost> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('social_posts')
      .update({
        is_published: true,
        published_at: now,
        platform_post_id: platform_post_id,
        updated_at: now,
      })
      .eq('id', post_id)
      .eq('business_id', business_id)
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to publish post');
    return data;
  }

  /**
   * Get scheduled posts ready to publish
   */
  static async getScheduledPostsReady(): Promise<SocialPost[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('is_published', false)
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true });

    if (error) throw this.handleError(error, 'Failed to fetch scheduled posts');
    return data || [];
  }

  /**
   * Delete a post
   */
  static async deletePost(post_id: string, business_id: string): Promise<void> {
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', post_id)
      .eq('business_id', business_id);

    if (error) throw this.handleError(error, 'Failed to delete post');
  }

  /**
   * Pin a post
   */
  static async pinPost(post_id: string, business_id: string): Promise<SocialPost> {
    const { data, error } = await supabase
      .from('social_posts')
      .update({
        is_pinned: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post_id)
      .eq('business_id', business_id)
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to pin post');
    return data;
  }

  /**
   * Unpin a post
   */
  static async unpinPost(post_id: string, business_id: string): Promise<SocialPost> {
    const { data, error } = await supabase
      .from('social_posts')
      .update({
        is_pinned: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post_id)
      .eq('business_id', business_id)
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to unpin post');
    return data;
  }

  /**
   * Update post metrics
   */
  static async updatePostMetrics(
    post_id: string,
    business_id: string,
    metrics: {
      likes_count: number;
      comments_count: number;
      shares_count: number;
    }
  ): Promise<SocialPost> {
    const engagement_count = metrics.likes_count + metrics.comments_count + metrics.shares_count;

    const { data, error } = await supabase
      .from('social_posts')
      .update({
        ...metrics,
        engagement_count,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post_id)
      .eq('business_id', business_id)
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to update post metrics');
    return data;
  }

  /**
   * Handle errors consistently
   */
  private static handleError(error: PostgrestError, context: string): Error {
    console.error(`${context}:`, error);
    return new Error(`${context}: ${error.message}`);
  }
}
