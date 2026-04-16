// Deno edge function: Execute automation rules based on triggers
// Handles: lead_added, email_opened, email_clicked, lead_qualified, inactivity_30d

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface AutomationRule {
  id: string;
  business_id: string;
  rule_name: string;
  trigger_type: string;
  trigger_conditions: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
}

interface TriggerPayload {
  business_id: string;
  trigger_type: string;
  trigger_data: Record<string, any>;
}

async function evaluateConditions(lead: any, conditions: Record<string, any>): Promise<boolean> {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // No conditions = always true
  }

  // Simple condition evaluation: field, operator, value
  const field = conditions.field;
  const operator = conditions.operator;
  const value = conditions.value;

  if (!field || !operator) return true;

  const leadValue = lead[field];

  switch (operator) {
    case "equals":
      return leadValue === value;
    case "not_equals":
      return leadValue !== value;
    case "contains":
      return String(leadValue).includes(String(value));
    case "greater_than":
      return Number(leadValue) > Number(value);
    case "less_than":
      return Number(leadValue) < Number(value);
    default:
      return true;
  }
}

async function executeAction(lead: any, rule: AutomationRule): Promise<{ success: boolean; message: string }> {
  try {
    switch (rule.action_type) {
      case "send_email": {
        const config = rule.action_config;
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Redeem Rocket <noreply@redeemrocket.in>",
            to: lead.email,
            subject: config.subject || `Automated: ${rule.rule_name}`,
            html: (config.body || "").replace(/{name}/g, lead.name || "Customer"),
          }),
        });

        if (response.ok) {
          return { success: true, message: `Email sent to ${lead.email}` };
        } else {
          return { success: false, message: `Email send failed: ${response.statusText}` };
        }
      }

      case "add_tag": {
        const { error } = await supabase
          .from("leads")
          .update({ tags: supabase.rpc("array_append", { arr: "tags", val: rule.action_config.tag }) })
          .eq("id", lead.id);

        if (error) {
          return { success: false, message: `Tag add failed: ${error.message}` };
        }
        return { success: true, message: `Tag added: ${rule.action_config.tag}` };
      }

      case "update_field": {
        const fieldUpdate = {
          [rule.action_config.field_name]: rule.action_config.field_value,
        };

        const { error } = await supabase.from("leads").update(fieldUpdate).eq("id", lead.id);

        if (error) {
          return { success: false, message: `Field update failed: ${error.message}` };
        }
        return { success: true, message: `Field updated: ${rule.action_config.field_name}` };
      }

      case "create_task": {
        // Could integrate with task management system
        return { success: true, message: `Task would be created: ${rule.action_config.task_title}` };
      }

      case "webhook": {
        if (!rule.action_config.webhook_url) {
          return { success: false, message: "Webhook URL not configured" };
        }

        try {
          const response = await fetch(rule.action_config.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lead, rule: rule.rule_name, timestamp: new Date().toISOString() }),
          });

          if (response.ok) {
            return { success: true, message: "Webhook triggered successfully" };
          } else {
            return { success: false, message: `Webhook failed: ${response.statusText}` };
          }
        } catch (err) {
          return { success: false, message: `Webhook error: ${String(err)}` };
        }
      }

      default:
        return { success: false, message: `Unknown action type: ${rule.action_type}` };
    }
  } catch (err) {
    return { success: false, message: `Action execution error: ${String(err)}` };
  }
}

async function processTrigger(payload: TriggerPayload): Promise<{ success: boolean; applied: number; failed: number; details: string[] }> {
  const details: string[] = [];
  let applied = 0;
  let failed = 0;

  try {
    // Get all active rules for this business and trigger type
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("business_id", payload.business_id)
      .eq("trigger_type", payload.trigger_type)
      .eq("is_active", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return { success: true, applied: 0, failed: 0, details: ["No matching rules found"] };
    }

    // Get the lead that triggered this
    const lead = payload.trigger_data;
    if (!lead.id) {
      return { success: false, applied: 0, failed: 0, details: ["Lead ID required in trigger data"] };
    }

    // Fetch full lead details
    const { data: fullLead, error: leadError } = await supabase.from("leads").select("*").eq("id", lead.id).single();

    if (leadError || !fullLead) {
      return { success: false, applied: 0, failed: 0, details: [`Lead not found: ${lead.id}`] };
    }

    // Process each rule
    for (const rule of rules as AutomationRule[]) {
      // Evaluate conditions
      const conditionsMet = await evaluateConditions(fullLead, rule.trigger_conditions);

      if (!conditionsMet) {
        details.push(`Rule "${rule.rule_name}" - Conditions not met`);
        continue;
      }

      // Execute action
      const actionResult = await executeAction(fullLead, rule);

      if (actionResult.success) {
        applied++;
        details.push(`✓ Rule "${rule.rule_name}" - ${actionResult.message}`);

        // Increment run count
        await supabase
          .from("automation_rules")
          .update({ run_count: supabase.rpc("increment", { x: 1 }) })
          .eq("id", rule.id);
      } else {
        failed++;
        details.push(`✗ Rule "${rule.rule_name}" - ${actionResult.message}`);
      }
    }

    console.log(`Automation trigger processed: ${applied} applied, ${failed} failed`);
    return { success: true, applied, failed, details };
  } catch (err) {
    console.error("Trigger processing error:", err);
    return { success: false, applied: 0, failed: 0, details: [String(err)] };
  }
}

// Main handler
Deno.serve(async (req: Request) => {
  try {
    const body = (await req.json()) as TriggerPayload;

    if (!body.business_id || !body.trigger_type) {
      return new Response(JSON.stringify({ error: "Missing business_id or trigger_type" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const result = await processTrigger(body);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Automation execution error:", err);
    return new Response(JSON.stringify({ error: String(err), success: false }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
