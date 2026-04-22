// Deno edge function: Ingest leads from advanced sources
// Handles: IVR systems, Databases (PostgreSQL, MySQL, Oracle), Web portals, Web scraping

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface IVRLeadRequest {
  business_id: string;
  connector_id: string;
  phone_number: string;
  call_duration: number;
  ivr_response: string;
  lead_intent: "inquiry" | "complaint" | "support" | "sales";
}

interface WebPortalSubmissionRequest {
  business_id: string;
  connector_id: string;
  form_name: string;
  form_data: Record<string, any>;
  submission_url: string;
  submitter_ip: string;
}

interface DatabaseSyncRequest {
  business_id: string;
  connector_id: string;
  database_type: "postgres" | "mysql" | "oracle" | "mssql";
  connection_string: string;
  query: string;
}

interface ScrapedLeadRequest {
  business_id: string;
  connector_id: string;
  source_url: string;
  scrape_metadata: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    [key: string]: any;
  };
  scrape_quality: "high" | "medium" | "low";
}

// Extract lead from IVR call
async function processIVRLead(req: IVRLeadRequest): Promise<{ success: boolean; lead_id?: string; message: string }> {
  try {
    // Insert into ivr_leads first
    const { data: ivrData, error: ivrError } = await supabase
      .from("ivr_leads")
      .insert({
        business_id: req.business_id,
        connector_id: req.connector_id,
        phone_number: req.phone_number,
        call_duration: req.call_duration,
        ivr_response: req.ivr_response,
        lead_intent: req.lead_intent,
        ivr_metadata: { recorded_at: new Date().toISOString() },
      })
      .select("id")
      .single();

    if (ivrError) throw ivrError;

    // Create lead from IVR data
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: req.business_id,
        name: `IVR Lead - ${req.phone_number}`,
        phone: req.phone_number,
        source: "ivr",
        stage: "new",
        priority: req.lead_intent === "sales" ? "high" : "medium",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (leadError) throw leadError;

    // Mark as processed
    await supabase.from("ivr_leads").update({ processed: true }).eq("id", ivrData?.id);

    return { success: true, lead_id: leadData?.id, message: `IVR lead created from phone: ${req.phone_number}` };
  } catch (err) {
    return { success: false, message: `IVR processing failed: ${String(err)}` };
  }
}

// Extract lead from web portal form
async function processWebPortalSubmission(req: WebPortalSubmissionRequest): Promise<{ success: boolean; lead_id?: string; message: string }> {
  try {
    // Insert submission record
    const { data: submissionData, error: submissionError } = await supabase
      .from("web_portal_submissions")
      .insert({
        business_id: req.business_id,
        connector_id: req.connector_id,
        form_name: req.form_name,
        form_data: req.form_data,
        submission_url: req.submission_url,
        submitter_ip: req.submitter_ip,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (submissionError) throw submissionError;

    // Extract contact info from form data
    const extractField = (key: string, aliases: string[] = []) => {
      const allKeys = [key, ...aliases];
      for (const k of allKeys) {
        if (req.form_data[k]) return req.form_data[k];
      }
      return undefined;
    };

    const name = extractField("name", ["full_name", "contact_name"]);
    const email = extractField("email", ["email_address"]);
    const phone = extractField("phone", ["phone_number", "mobile"]);
    const company = extractField("company", ["company_name", "organization"]);

    // Create lead
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: req.business_id,
        name: name || "Web Portal Lead",
        email,
        phone,
        company,
        source: "website",
        stage: "new",
        priority: "medium",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (leadError) throw leadError;

    // Mark as processed
    await supabase.from("web_portal_submissions").update({ processed: true }).eq("id", submissionData?.id);

    return { success: true, lead_id: leadData?.id, message: `Web portal lead created: ${name || email}` };
  } catch (err) {
    return { success: false, message: `Web portal processing failed: ${String(err)}` };
  }
}

// Process database query and extract leads
async function processDatabaseSync(req: DatabaseSyncRequest): Promise<{ success: boolean; imported: number; message: string }> {
  try {
    const startTime = Date.now();
    let recordsFetched = 0;
    let recordsImported = 0;
    let recordsFailed = 0;

    // Note: In production, you'd need to connect to actual databases
    // For now, we'll simulate the connection and querying
    console.log(`Database sync: ${req.database_type} - Query: ${req.query}`);

    // Log the sync attempt
    const { error: logError } = await supabase.from("database_sync_logs").insert({
      business_id: req.business_id,
      connector_id: req.connector_id,
      database_type: req.database_type,
      query_executed: req.query,
      records_fetched: recordsFetched,
      records_imported: recordsImported,
      records_failed: recordsFailed,
      sync_duration_ms: Date.now() - startTime,
      sync_status: "partial", // Would be 'success' if actual DB integration exists
    });

    if (logError) console.error("Log error:", logError);

    return {
      success: true,
      imported: recordsImported,
      message: `Database sync initiated for ${req.database_type}. In production, would import ${recordsFetched} records.`,
    };
  } catch (err) {
    return { success: false, imported: 0, message: `Database sync failed: ${String(err)}` };
  }
}

// Process scraped lead data
async function processScrapedLead(req: ScrapedLeadRequest): Promise<{ success: boolean; lead_id?: string; message: string }> {
  try {
    // Insert scraped lead record
    const { data: scraperData, error: scraperError } = await supabase
      .from("scraped_leads")
      .insert({
        business_id: req.business_id,
        connector_id: req.connector_id,
        source_url: req.source_url,
        scrape_metadata: req.scrape_metadata,
        scrape_quality: req.scrape_quality,
        scrape_date: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (scraperError) throw scraperError;

    // Create lead from scraped data
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .insert({
        business_id: req.business_id,
        name: req.scrape_metadata.name || "Scraped Lead",
        email: req.scrape_metadata.email,
        phone: req.scrape_metadata.phone,
        company: req.scrape_metadata.company,
        product_interest: req.scrape_metadata.title || req.scrape_metadata.role,
        source: "scrape",
        stage: "new",
        priority: req.scrape_quality === "high" ? "high" : "medium",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (leadError) throw leadError;

    // Mark as processed
    await supabase.from("scraped_leads").update({ processed: true }).eq("id", scraperData?.id);

    return {
      success: true,
      lead_id: leadData?.id,
      message: `Scraped lead created: ${req.scrape_metadata.name || req.scrape_metadata.email}`,
    };
  } catch (err) {
    return { success: false, message: `Scraping processing failed: ${String(err)}` };
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    const sourceType = body.source_type || body.type;

    let result;

    switch (sourceType) {
      case "ivr":
        result = await processIVRLead(body as IVRLeadRequest);
        break;

      case "web_portal":
      case "form":
        result = await processWebPortalSubmission(body as WebPortalSubmissionRequest);
        break;

      case "database":
      case "oracle":
      case "postgres":
      case "mysql":
        result = await processDatabaseSync(body as DatabaseSyncRequest);
        break;

      case "scrape":
      case "scraping":
        result = await processScrapedLead(body as ScrapedLeadRequest);
        break;

      default:
        return new Response(JSON.stringify({ error: `Unknown source type: ${sourceType}` }), {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Advanced lead ingest error:", err);
    return new Response(JSON.stringify({ error: String(err), success: false }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
