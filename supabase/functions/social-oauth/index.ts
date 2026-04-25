// Deno edge function: Social Media OAuth Handler
// Handles: OAuth authorization, token exchange, account linking

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
}

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  twitter: {
    clientId: Deno.env.get("TWITTER_CLIENT_ID") || "",
    clientSecret: Deno.env.get("TWITTER_CLIENT_SECRET") || "",
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://twitter.com/2/oauth2/token",
    userInfoUrl: "https://api.twitter.com/2/users/me",
    redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-oauth/callback`,
  },
  linkedin: {
    clientId: Deno.env.get("LINKEDIN_CLIENT_ID") || "",
    clientSecret: Deno.env.get("LINKEDIN_CLIENT_SECRET") || "",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    userInfoUrl: "https://api.linkedin.com/v2/me",
    redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-oauth/callback`,
  },
  facebook: {
    clientId: Deno.env.get("FACEBOOK_CLIENT_ID") || "",
    clientSecret: Deno.env.get("FACEBOOK_CLIENT_SECRET") || "",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/v18.0/me",
    redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-oauth/callback`,
  },
  instagram: {
    clientId: Deno.env.get("INSTAGRAM_CLIENT_ID") || "",
    clientSecret: Deno.env.get("INSTAGRAM_CLIENT_SECRET") || "",
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://graph.instagram.com/access_token",
    userInfoUrl: "https://graph.instagram.com/me",
    redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-oauth/callback`,
  },
  tiktok: {
    clientId: Deno.env.get("TIKTOK_CLIENT_ID") || "",
    clientSecret: Deno.env.get("TIKTOK_CLIENT_SECRET") || "",
    authUrl: "https://www.tiktok.com/v1/oauth/authorize",
    tokenUrl: "https://open-api.tiktok.com/oauth/token/",
    userInfoUrl: "https://open-api.tiktok.com/user/info/",
    redirectUri: `${Deno.env.get("SUPABASE_URL")}/functions/v1/social-oauth/callback`,
  },
};

// Generate OAuth authorization URL
async function generateAuthUrl(
  platform: string,
  state: string,
  redirectUrl: string
): Promise<{ url: string; state: string } | { error: string }> {
  const config = OAUTH_CONFIGS[platform];
  if (!config || !config.clientId) {
    return { error: `OAuth not configured for ${platform}` };
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUrl || config.redirectUri,
    response_type: "code",
    scope: getPlatformScopes(platform),
    state,
  });

  return {
    url: `${config.authUrl}?${params.toString()}`,
    state,
  };
}

// Exchange authorization code for access token
async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
} | { error: string }> {
  const config = OAUTH_CONFIGS[platform];
  if (!config || !config.clientSecret) {
    return { error: `OAuth not configured for ${platform}` };
  }

  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri || config.redirectUri,
    });

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      body: params.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
      const error = await response.text();
      return { error: `Token exchange failed: ${error}` };
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 3600,
    };
  } catch (err) {
    return { error: String(err) };
  }
}

// Get user info from platform
async function getUserInfo(
  platform: string,
  accessToken: string
): Promise<{ [key: string]: any } | { error: string }> {
  const config = OAUTH_CONFIGS[platform];
  if (!config) {
    return { error: `Unknown platform: ${platform}` };
  }

  try {
    const response = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return { error: "Failed to fetch user info" };
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return { error: String(err) };
  }
}

// Link social account to business
async function linkSocialAccount(
  businessId: string,
  platform: string,
  accountData: { [key: string]: any },
  accessToken: string,
  refreshToken?: string
): Promise<{ success: boolean; account_id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("social_accounts")
      .insert({
        business_id: businessId,
        platform,
        account_name: accountData.name || accountData.username || "Unknown",
        account_id: accountData.id || accountData.account_id || "",
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: new Date(Date.now() + 3600000).toISOString(),
        is_connected: true,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, account_id: data.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Get platform scopes
function getPlatformScopes(platform: string): string {
  const scopes: Record<string, string> = {
    twitter: "tweet.read users.read follows.read follows.manage",
    linkedin: "r_liteprofile r_emailaddress r_basicprofile w_member_social",
    facebook: "pages_manage_metadata instagram_basic leads_retrieval",
    instagram: "instagram_basic instagram_graph_user_media instagram_manage_messages",
    tiktok: "user.info.basic video.list comment.list",
  };
  return scopes[platform] || "";
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    // Only allow POST
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET",
          "Access-Control-Allow-Headers": "authorization, content-type",
        },
      });
    }

    const body = await req.json();
    const { action, platform, code, state, redirectUrl, businessId, accessToken, accountData, refreshToken } = body;

    if (!action || !platform) {
      return new Response(
        JSON.stringify({ error: "Missing action or platform" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let result: any;

    switch (action) {
      case "authorize":
        result = await generateAuthUrl(platform, state || Math.random().toString(36), redirectUrl);
        break;

      case "exchange":
        if (!code) {
          result = { error: "Authorization code required" };
        } else {
          result = await exchangeCodeForToken(platform, code, redirectUrl);
        }
        break;

      case "get-user-info":
        if (!accessToken) {
          result = { error: "Access token required" };
        } else {
          result = await getUserInfo(platform, accessToken);
        }
        break;

      case "link-account":
        if (!businessId || !accessToken || !accountData) {
          result = { error: "Missing required parameters" };
        } else {
          result = await linkSocialAccount(businessId, platform, accountData, accessToken, refreshToken);
        }
        break;

      default:
        result = { error: `Unknown action: ${action}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: result.error ? 400 : 200,
    });
  } catch (err) {
    console.error("OAuth error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
