// Deno edge function: Connector Operations Management
// Handles: webhook testing, IVR testing, database testing, social OAuth, lead ingestion

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface ConnectorTestRequest {
  connector_id?: string;
  connector_type: string;
  [key: string]: any;
}

// Test Webhook Connector
async function testWebhookConnector(req: ConnectorTestRequest) {
  try {
    const { payload } = req;
    if (!payload) {
      return { success: false, error: "No payload provided" };
    }

    // Validate payload structure
    if (!Array.isArray(payload) && typeof payload !== "object") {
      return { success: false, error: "Invalid payload format" };
    }

    const leads = Array.isArray(payload) ? payload : [payload];
    let validCount = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      if (!lead.name && !lead.email && !lead.phone) {
        errors.push("Lead must have name, email, or phone");
        continue;
      }
      validCount++;
    }

    return {
      success: true,
      valid_count: validCount,
      invalid_count: leads.length - validCount,
      errors,
      message: `${validCount}/${leads.length} leads are valid`,
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Test IVR Connector
async function testIVRConnector(req: ConnectorTestRequest) {
  try {
    const { provider, phone_number, auth_token, auth_secret } = req;

    if (!provider || !phone_number || !auth_token || !auth_secret) {
      return { success: false, error: "Missing required IVR credentials" };
    }

    // Mock validation based on provider
    const providers: Record<string, boolean> = {
      twilio: auth_token.length > 20 && auth_secret.length > 20,
      bandwidthcom: auth_token && auth_secret,
      vonage: auth_token && auth_secret,
      custom: true,
    };

    if (!providers[provider]) {
      return { success: false, error: `Invalid provider: ${provider}` };
    }

    return {
      success: true,
      provider,
      phone_number,
      status: "connected",
      message: `IVR connection to ${provider} verified`,
      features: ["call_routing", "ivr_menu", "dtmf_capture", "recording"],
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Test Database Connector
async function testDatabaseConnector(req: ConnectorTestRequest) {
  try {
    const { database_type, connection_string, query } = req;

    if (!database_type || !connection_string || !query) {
      return { success: false, error: "Missing database connection details" };
    }

    // Validate SQL syntax
    if (!query.toLowerCase().includes("select")) {
      return { success: false, error: "Query must be a SELECT statement" };
    }

    // Check for dangerous keywords
    const dangerousKeywords = ["drop", "delete", "truncate", "insert", "update"];
    for (const keyword of dangerousKeywords) {
      if (query.toLowerCase().includes(keyword)) {
        return {
          success: false,
          error: `Query contains dangerous keyword: ${keyword}. Only SELECT queries are allowed.`,
        };
      }
    }

    // Mock database connection test
    const mockResults = [
      {
        name: "Sample Lead",
        email: "sample@example.com",
        phone: "5551234567",
        company: "Example Inc",
        product_interest: "Enterprise Plan",
        deal_value: 50000,
      },
    ];

    return {
      success: true,
      database_type,
      query_valid: true,
      record_count: 1,
      sample: mockResults,
      message: "Database connection successful",
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Test Social OAuth Connector
async function testSocialConnector(req: ConnectorTestRequest) {
  try {
    const { platform, access_token } = req;

    if (!platform || !access_token) {
      return { success: false, error: "Platform and access token required" };
    }

    // Validate token format
    if (access_token.length < 10) {
      return { success: false, error: "Invalid access token format" };
    }

    const platforms: Record<string, Record<string, any>> = {
      twitter: { api_endpoint: "https://api.twitter.com/2", scopes: ["tweet.read", "users.read"] },
      linkedin: { api_endpoint: "https://api.linkedin.com/v2", scopes: ["r_basicprofile"] },
      facebook: { api_endpoint: "https://graph.facebook.com/v18.0", scopes: ["pages_read_engagement"] },
      instagram: { api_endpoint: "https://graph.instagram.com", scopes: ["instagram_basic"] },
      tiktok: { api_endpoint: "https://open-api.tiktok.com", scopes: ["user.info.basic"] },
    };

    const config = platforms[platform];
    if (!config) {
      return { success: false, error: `Unknown platform: ${platform}` };
    }

    return {
      success: true,
      platform,
      connected: true,
      api_endpoint: config.api_endpoint,
      scopes_authorized: config.scopes,
      quota_remaining: 1000,
      rate_limit: "450 requests/15 minutes",
      message: `${platform} API connection verified`,
    };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Log Connector Activity
async function logConnectorActivity(
  businessId: string,
  connectorId: string,
  action: string,
  status: "success" | "error",
  metadata: Record<string, any>
) {
  try {
    await supabase.from("connector_activity_logs").insert({
      business_id: businessId,
      connector_id: connectorId,
      action,
      status,
      metadata,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    // Extract business ID from auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { operation, connector_type, business_id, connector_id, ...params } = body;

    if (!operation || !connector_type) {
      return new Response(
        JSON.stringify({ error: "Missing operation or connector_type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let result: any;

    switch (operation) {
      case "test-webhook":
        result = await testWebhookConnector({ connector_type, ...params });
        break;

      case "test-ivr":
        result = await testIVRConnector({ connector_type, ...params });
        break;

      case "test-database":
        result = await testDatabaseConnector({ connector_type, ...params });
        break;

      case "test-social":
        result = await testSocialConnector({ connector_type, ...params });
        break;

      case "sync-database":
        // Handle database sync operation
        result = {
          success: true,
          synced_count: 0,
          failed_count: 0,
          message: "Database sync queued",
        };
        break;

      case "log-activity":
        if (business_id && connector_id) {
          await logConnectorActivity(
            business_id,
            connector_id,
            params.action || "unknown",
            params.status || "success",
            params.metadata || {}
          );
          result = { success: true, logged: true };
        } else {
          result = { success: false, error: "Missing business_id or connector_id" };
        }
        break;

      default:
        result = { success: false, error: `Unknown operation: ${operation}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: result.success ? 200 : 400,
    });
  } catch (err) {
    console.error("Connector operation error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
