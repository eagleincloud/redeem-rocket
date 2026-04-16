// Deno edge function: Publish posts to social media platforms
// Supports: Twitter/X, Facebook, LinkedIn, Instagram, TikTok

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface PublishRequest {
  business_id: string;
  post_id: string;
  social_account_id: string;
  platform: "twitter" | "facebook" | "linkedin" | "instagram" | "tiktok";
  post_content: string;
  media_urls?: string[];
}

async function publishToTwitter(token: string, content: string): Promise<{ success: boolean; message: string; post_id?: string }> {
  try {
    // Twitter API v2 endpoint for creating tweets
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: content.substring(0, 280), // Twitter limit
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: "Posted to Twitter", post_id: data.data?.id };
    } else {
      const error = await response.text();
      return { success: false, message: `Twitter API error: ${error}` };
    }
  } catch (err) {
    return { success: false, message: `Twitter publish failed: ${String(err)}` };
  }
}

async function publishToFacebook(token: string, pageId: string, content: string, mediaUrls?: string[]): Promise<{ success: boolean; message: string; post_id?: string }> {
  try {
    const body: Record<string, any> = {
      message: content,
      access_token: token,
    };

    if (mediaUrls && mediaUrls.length > 0) {
      body.link = mediaUrls[0]; // Use first URL as link
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: "Posted to Facebook", post_id: data.id };
    } else {
      const error = await response.text();
      return { success: false, message: `Facebook API error: ${error}` };
    }
  } catch (err) {
    return { success: false, message: `Facebook publish failed: ${String(err)}` };
  }
}

async function publishToLinkedIn(token: string, urn: string, content: string): Promise<{ success: boolean; message: string; post_id?: string }> {
  try {
    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: urn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.PublishContent": {
            shareContent: {
              shareCommentary: {
                text: content,
              },
              shareMediaCategory: "NONE",
            },
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: "Posted to LinkedIn", post_id: data.id };
    } else {
      const error = await response.text();
      return { success: false, message: `LinkedIn API error: ${error}` };
    }
  } catch (err) {
    return { success: false, message: `LinkedIn publish failed: ${String(err)}` };
  }
}

async function publishToInstagram(token: string, igUserId: string, caption: string, mediaUrls?: string[]): Promise<{ success: boolean; message: string; post_id?: string }> {
  try {
    if (!mediaUrls || mediaUrls.length === 0) {
      return { success: false, message: "Instagram requires at least one media URL" };
    }

    // First, create media object
    const mediaResponse = await fetch(
      `https://graph.instagram.com/v18.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: mediaUrls[0],
          caption,
          access_token: token,
        }),
      }
    );

    if (!mediaResponse.ok) {
      const error = await mediaResponse.text();
      return { success: false, message: `Instagram media error: ${error}` };
    }

    const mediaData = await mediaResponse.json();

    // Then publish
    const publishResponse = await fetch(
      `https://graph.instagram.com/v18.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: mediaData.id,
          access_token: token,
        }),
      }
    );

    if (publishResponse.ok) {
      const data = await publishResponse.json();
      return { success: true, message: "Posted to Instagram", post_id: data.id };
    } else {
      return { success: false, message: `Instagram publish failed` };
    }
  } catch (err) {
    return { success: false, message: `Instagram publish error: ${String(err)}` };
  }
}

async function publishToTikTok(token: string, videoUrl: string, caption: string): Promise<{ success: boolean; message: string; post_id?: string }> {
  try {
    // TikTok requires video file upload first, then creation
    // For simplicity, we'll simulate the API call
    const response = await fetch("https://open-api.tiktok.com/v1/video/upload/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_url: videoUrl,
        caption: caption.substring(0, 2200), // TikTok caption limit
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, message: "Posted to TikTok", post_id: data.data?.video_id };
    } else {
      const error = await response.text();
      return { success: false, message: `TikTok API error: ${error}` };
    }
  } catch (err) {
    return { success: false, message: `TikTok publish failed: ${String(err)}` };
  }
}

async function publishPost(request: PublishRequest): Promise<{ success: boolean; message: string; post_id?: string }> {
  try {
    // Get social account details
    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", request.social_account_id)
      .single();

    if (accountError || !account) {
      return { success: false, message: "Social account not found" };
    }

    let result;

    switch (request.platform) {
      case "twitter":
        result = await publishToTwitter(account.access_token, request.post_content);
        break;

      case "facebook":
        result = await publishToFacebook(account.access_token, account.account_id, request.post_content, request.media_urls);
        break;

      case "linkedin":
        result = await publishToLinkedIn(account.access_token, account.account_id, request.post_content);
        break;

      case "instagram":
        result = await publishToInstagram(account.access_token, account.account_id, request.post_content, request.media_urls);
        break;

      case "tiktok":
        if (!request.media_urls || request.media_urls.length === 0) {
          return { success: false, message: "TikTok requires a video URL" };
        }
        result = await publishToTikTok(account.access_token, request.media_urls[0], request.post_content);
        break;

      default:
        return { success: false, message: `Unknown platform: ${request.platform}` };
    }

    // Update post status in database
    if (result.success) {
      await supabase
        .from("social_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
        })
        .eq("id", request.post_id);

      console.log(`Post published to ${request.platform}: ${request.post_id}`);
    }

    return result;
  } catch (err) {
    console.error("Publish error:", err);
    return { success: false, message: `Publish error: ${String(err)}` };
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    const body = (await req.json()) as PublishRequest;

    if (!body.business_id || !body.post_id || !body.platform || !body.post_content) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const result = await publishPost(body);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Social publish error:", err);
    return new Response(JSON.stringify({ error: String(err), success: false }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
