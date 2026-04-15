import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusiness } from '../context/BusinessContext';
import {
  fetchSocialAccounts,
  createSocialAccount,
  deleteSocialAccount,
  fetchSocialPosts,
  createSocialPost,
  publishSocialPost,
  deleteSocialPost,
} from '@/app/api/supabase-data';

type Platform = 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok';
type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  is_connected: boolean;
  followers_count: number;
}

interface SocialPost {
  id: string;
  platform: string;
  post_content: string;
  status: PostStatus;
  scheduled_at?: string;
  published_at?: string;
  likes_count: number;
  shares_count: number;
}

export const SocialPage: React.FC = () => {
  const { isDark } = useTheme();
  const { businessId } = useBusiness();
  const [activeTab, setActiveTab] = useState<'accounts' | 'posts'>('accounts');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [postFormData, setPostFormData] = useState({
    post_content: '',
    scheduled_at: '',
  });

  const colors = {
    bg: isDark ? '#0b1220' : '#ffffff',
    card: isDark ? '#111827' : '#f9fafb',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',
    text: isDark ? '#f1f5f9' : '#1f2937',
    textMuted: isDark ? '#6b7280' : '#6b7280',
    primary: '#6366f1',
    accent: '#F97316',
  };

  const platformIcons: Record<Platform, string> = {
    twitter: '𝕏',
    facebook: 'f',
    linkedin: 'in',
    instagram: '📷',
    tiktok: '♪',
  };

  const platformColors: Record<Platform, string> = {
    twitter: '#1DA1F2',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    instagram: '#E4405F',
    tiktok: '#000000',
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [accountsData, postsData] = await Promise.all([
        fetchSocialAccounts(businessId),
        fetchSocialPosts(businessId),
      ]);
      setAccounts(accountsData as SocialAccount[]);
      setPosts(postsData as SocialPost[]);
      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0].id);
      }
    } catch (err) {
      console.error('Load data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteSocialAccount(accountId);
      await loadData();
    } catch (err) {
      console.error('Delete account failed:', err);
    }
  };

  const handleCreatePost = async () => {
    if (!businessId || !selectedAccount || !postFormData.post_content) return;

    try {
      const account = accounts.find((a) => a.id === selectedAccount);
      if (!account) return;

      await createSocialPost(businessId, {
        social_account_id: selectedAccount,
        platform: account.platform,
        post_content: postFormData.post_content,
        scheduled_at: postFormData.scheduled_at || undefined,
      });

      setPostFormData({ post_content: '', scheduled_at: '' });
      setShowNewPostForm(false);
      await loadData();
    } catch (err) {
      console.error('Create post failed:', err);
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      await publishSocialPost(postId);
      await loadData();
    } catch (err) {
      console.error('Publish post failed:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteSocialPost(postId);
      await loadData();
    } catch (err) {
      console.error('Delete post failed:', err);
    }
  };

  const charCount = postFormData.post_content.length;
  const charLimit = 280;
  const isOverLimit = charCount > charLimit;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: colors.bg }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, margin: '0 0 8px 0' }}>
          Social Media
        </h1>
        <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
          Connect accounts and schedule posts across platforms
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
        {(['accounts', 'posts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab ? colors.primary : colors.textMuted,
              borderBottom: activeTab === tab ? `2px solid ${colors.primary}` : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '500',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: '0 0 16px 0' }}>
              Connected Accounts
            </h2>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
              Connect your social media accounts to schedule posts and track engagement
            </p>
          </div>

          {loading ? (
            <p style={{ color: colors.textMuted }}>Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📱</p>
              <p style={{ color: colors.textMuted, marginBottom: '16px' }}>No accounts connected yet</p>
              <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                Connect your first social account to start scheduling posts
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {accounts.map((account) => (
                <div
                  key={account.id}
                  style={{
                    background: colors.card,
                    border: `2px solid ${platformColors[account.platform as Platform] || colors.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: platformColors[account.platform as Platform] || colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                      }}
                    >
                      {platformIcons[account.platform as Platform]}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: '0 0 4px 0' }}>
                        {account.account_name}
                      </h3>
                      <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                        {account.followers_count.toLocaleString()} followers
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: colors.accent,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Account Section */}
          <div
            style={{
              background: colors.card,
              border: `1px dashed ${colors.border}`,
              borderRadius: '8px',
              padding: '32px 24px',
              textAlign: 'center',
              marginTop: '24px',
            }}
          >
            <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🔗</p>
            <p style={{ fontSize: '14px', fontWeight: '500', color: colors.text, margin: '0 0 4px 0' }}>
              Connect a Social Account
            </p>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '0 0 16px 0' }}>
              Click a platform below to authenticate
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(['twitter', 'facebook', 'linkedin', 'instagram', 'tiktok'] as const).map((platform) => (
                <button
                  key={platform}
                  style={{
                    padding: '8px 16px',
                    background: platformColors[platform],
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                  }}
                >
                  Connect {platform}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: '0 0 4px 0' }}>
                Scheduled Posts
              </h2>
              <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                Create and schedule posts for your connected accounts
              </p>
            </div>
            {accounts.length > 0 && (
              <button
                onClick={() => setShowNewPostForm(!showNewPostForm)}
                style={{
                  padding: '10px 20px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  height: 'fit-content',
                }}
              >
                {showNewPostForm ? 'Cancel' : '+ New Post'}
              </button>
            )}
          </div>

          {/* New Post Form */}
          {showNewPostForm && accounts.length > 0 && (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginTop: 0 }}>
                Create New Post
              </h3>

              {/* Account Selection */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                  Post to Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name} ({account.platform})
                    </option>
                  ))}
                </select>
              </div>

              {/* Post Content */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                  Post Content
                </label>
                <textarea
                  placeholder="What's on your mind?"
                  value={postFormData.post_content}
                  onChange={(e) => setPostFormData({ ...postFormData, post_content: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                    {charCount} / {charLimit} characters
                  </p>
                  {isOverLimit && <p style={{ fontSize: '12px', color: colors.accent, margin: 0 }}>Over limit</p>}
                </div>
              </div>

              {/* Schedule Date/Time */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
                  Schedule For (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={postFormData.scheduled_at}
                  onChange={(e) => setPostFormData({ ...postFormData, scheduled_at: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={handleCreatePost}
                disabled={!postFormData.post_content || isOverLimit}
                style={{
                  padding: '8px 16px',
                  background: !postFormData.post_content || isOverLimit ? colors.textMuted : colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !postFormData.post_content || isOverLimit ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  opacity: !postFormData.post_content || isOverLimit ? 0.5 : 1,
                }}
              >
                {postFormData.scheduled_at ? 'Schedule Post' : 'Post Now'}
              </button>
            </div>
          )}

          {/* Posts List */}
          {accounts.length === 0 ? (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: colors.textMuted, margin: 0 }}>Connect an account first to create posts</p>
            </div>
          ) : posts.length === 0 ? (
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📝</p>
              <p style={{ color: colors.textMuted, margin: 0 }}>No posts yet. Create your first post above.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {posts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: colors.primary,
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginRight: '8px',
                          }}
                        >
                          {post.platform.toUpperCase()}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: post.status === 'published' ? colors.accent : colors.border,
                            color: post.status === 'published' ? 'white' : colors.textMuted,
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                          }}
                        >
                          {post.status}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', color: colors.text, margin: '8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {post.post_content}
                    </p>
                    {post.scheduled_at && (
                      <p style={{ fontSize: '12px', color: colors.textMuted, margin: '8px 0 0 0' }}>
                        Scheduled for {new Date(post.scheduled_at).toLocaleString()}
                      </p>
                    )}
                    {post.published_at && (
                      <p style={{ fontSize: '12px', color: colors.textMuted, margin: '8px 0 0 0' }}>
                        Published {new Date(post.published_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {post.status === 'published' && (
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: '8px 0 0 0' }}>
                      👍 {post.likes_count} likes • 🔄 {post.shares_count} shares
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handlePublishPost(post.id)}
                        style={{
                          padding: '6px 12px',
                          background: colors.accent,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: colors.accent,
                        border: `1px solid ${colors.accent}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
