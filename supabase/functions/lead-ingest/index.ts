// Deno edge function: Ingest leads via webhook or direct API call
// Handles: webhook payloads, CSV imports, form submissions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface LeadData {
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  product_interest?: string;
  deal_value?: number;
  source: "webhook" | "csv" | "form_embed" | "api" | "zapier";
}

interface WebhookPayload {
  business_id: string;
  leads: LeadData[];
}

interface CSVImportRequest {
  business_id: string;
  csv_data: string; // CSV as string
  connector_id?: string;
}

async function validateLead(lead: LeadData): Promise<{ valid: boolean; error?: string }> {
  // Must have at least name or email or phone
  if (!lead.name && !lead.email && !lead.phone) {
    return { valid: false, error: "Lead must have name, email, or phone" };
  }

  // Email must be valid format
  if (lead.email && !lead.email.includes("@")) {
    return { valid: false, error: "Invalid email format" };
  }

  // Phone should be numeric
  if (lead.phone && !/^\d{6,}/.test(lead.phone.replace(/\D/g, ""))) {
    return { valid: false, error: "Phone must be valid" };
  }

  return { valid: true };
}

async function insertLead(lead: LeadData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("leads")
      .insert({
        business_id: lead.business_id,
        name: lead.name || "Unknown Lead",
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        product_interest: lead.product_interest,
        deal_value: lead.deal_value || 0,
        source: lead.source,
        stage: "new",
        priority: "medium",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function processWebhook(payload: WebhookPayload): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (const lead of payload.leads) {
    const validation = await validateLead(lead);
    if (!validation.valid) {
      errors.push(`${lead.name || lead.email}: ${validation.error}`);
      failed++;
      continue;
    }

    const result = await insertLead(lead);
    if (result.success) {
      imported++;
      console.log(`Imported lead: ${lead.name || lead.email} (${result.id})`);
    } else {
      errors.push(`${lead.name || lead.email}: ${result.error}`);
      failed++;
    }
  }

  return { success: true, imported, failed, errors };
}

async function processCSV(request: CSVImportRequest): Promise<{ success: boolean; imported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  try {
    const lines = request.csv_data.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());

    // Find column indices
    const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("first"));
    const emailIdx = headers.findIndex(h => h.includes("email"));
    const phoneIdx = headers.findIndex(h => h.includes("phone"));
    const companyIdx = headers.findIndex(h => h.includes("company"));
    const productIdx = headers.findIndex(h => h.includes("product") || h.includes("interest"));
    const dealIdx = headers.findIndex(h => h.includes("deal") || h.includes("value"));

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map(c => c.trim());

      const lead: LeadData = {
        business_id: request.business_id,
        name: nameIdx >= 0 ? cells[nameIdx] : undefined,
        email: emailIdx >= 0 ? cells[emailIdx] : undefined,
        phone: phoneIdx >= 0 ? cells[phoneIdx] : undefined,
        company: companyIdx >= 0 ? cells[companyIdx] : undefined,
        product_interest: productIdx >= 0 ? cells[productIdx] : undefined,
        deal_value: dealIdx >= 0 ? parseFloat(cells[dealIdx]) : undefined,
        source: "csv",
      };

      const validation = await validateLead(lead);
      if (!validation.valid) {
        errors.push(`Row ${i}: ${validation.error}`);
        failed++;
        continue;
      }

      const result = await insertLead(lead);
      if (result.success) {
        imported++;
        console.log(`Imported CSV lead: ${lead.name || lead.email} (${result.id})`);
      } else {
        errors.push(`Row ${i}: ${result.error}`);
        failed++;
      }
    }

    // Update connector sync stats
    if (request.connector_id) {
      await supabase
        .from("lead_connectors")
        .update({
          sync_count: supabase.rpc("increment", { x: 1 }),
          last_sync_at: new Date().toISOString(),
        })
        .eq("id", request.connector_id);
    }

    return { success: true, imported, failed, errors };
  } catch (err) {
    return { success: false, imported: 0, failed: 0, errors: [String(err)] };
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();

    // Webhook: expects { business_id, leads: [...] }
    if (body.leads && Array.isArray(body.leads)) {
      console.log(`Processing webhook with ${body.leads.length} leads`);
      const result = await processWebhook(body as WebhookPayload);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // CSV import: expects { business_id, csv_data, connector_id? }
    if (body.csv_data && typeof body.csv_data === "string") {
      console.log("Processing CSV import");
      const result = await processCSV(body as CSVImportRequest);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid request format" }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  } catch (err) {
    console.error("Lead ingest error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
