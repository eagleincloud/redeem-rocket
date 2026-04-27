// Supabase Edge Function: Execute Automation Rules
// Comprehensive rule engine with trigger evaluation, condition checking, and action execution
// Handles: lead_added, stage_changed, inactivity, email_opened, email_clicked, milestone_reached

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseKey);

interface AutomationRule {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger_type: string;
  trigger_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at?: string;
}

interface AutomationCondition {
  id: string;
  rule_id: string;
  field_name: string;
  operator: string;
  value?: string;
  value_type: string;
  logic_operator: string;
  parent_id?: string;
  order_index: number;
}

interface AutomationAction {
  id: string;
  rule_id: string;
  action_type: string;
  action_config: Record<string, any>;
  delay_seconds: number;
  order_index: number;
}

interface TriggerPayload {
  business_id: string;
  trigger_type: string;
  trigger_data: Record<string, any>;
  entity_id?: string;
  entity_type?: string;
}

interface ExecutionResult {
  execution_id: string;
  rule_id: string;
  status: string;
  trigger_passed: boolean;
  conditions_passed: number;
  conditions_failed: number;
  actions_executed: number;
  actions_failed: number;
  errors: string[];
  duration_ms: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Condition Evaluation Engine
// ─────────────────────────────────────────────────────────────────────────────

function evaluateOperator(fieldValue: any, operator: string, conditionValue: any, valueType: string): boolean {
  // Type coercion based on value_type
  let actualValue = fieldValue;
  let compareValue = conditionValue;

  if (valueType === "number") {
    actualValue = Number(fieldValue);
    compareValue = Number(conditionValue);
  } else if (valueType === "date") {
    actualValue = new Date(fieldValue).getTime();
    compareValue = new Date(conditionValue).getTime();
  } else if (valueType === "array") {
    actualValue = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
    compareValue = Array.isArray(conditionValue) ? conditionValue : [conditionValue];
  }

  switch (operator) {
    // String operators
    case "equals":
      return String(actualValue) === String(compareValue);
    case "not_equals":
      return String(actualValue) !== String(compareValue);
    case "contains":
      return String(actualValue).includes(String(compareValue));
    case "not_contains":
      return !String(actualValue).includes(String(compareValue));
    case "starts_with":
      return String(actualValue).startsWith(String(compareValue));
    case "ends_with":
      return String(actualValue).endsWith(String(compareValue));
    case "matches_regex":
      try {
        return new RegExp(String(compareValue)).test(String(actualValue));
      } catch {
        return false;
      }

    // Numeric operators
    case "greater_than":
      return Number(actualValue) > Number(compareValue);
    case "less_than":
      return Number(actualValue) < Number(compareValue);
    case "between":
      const [min, max] = Array.isArray(compareValue) ? compareValue : [compareValue, compareValue];
      return Number(actualValue) >= Number(min) && Number(actualValue) <= Number(max);

    // Empty operators
    case "is_empty":
      return !actualValue || String(actualValue).trim() === "";
    case "is_not_empty":
      return !!actualValue && String(actualValue).trim() !== "";

    // Set operators
    case "in_list":
      const list = Array.isArray(compareValue) ? compareValue : String(compareValue).split(",").map(v => v.trim());
      return list.includes(String(actualValue));
    case "not_in_list":
      const notList = Array.isArray(compareValue) ? compareValue : String(compareValue).split(",").map(v => v.trim());
      return !notList.includes(String(actualValue));

    // Date operators
    case "date_equals":
      return new Date(actualValue).toDateString() === new Date(compareValue).toDateString();
    case "date_after":
      return new Date(actualValue) > new Date(compareValue);
    case "date_before":
      return new Date(actualValue) < new Date(compareValue);

    // Pattern operator
    case "matches_pattern":
      try {
        return new RegExp(String(compareValue)).test(String(actualValue));
      } catch {
        return false;
      }

    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

async function evaluateConditions(
  entity: any,
  conditions: AutomationCondition[],
  ruleId: string,
  executionId: string
): Promise<{ passed: boolean; failedCount: number; logs: string[] }> {
  const logs: string[] = [];

  if (!conditions || conditions.length === 0) {
    return { passed: true, failedCount: 0, logs: ["No conditions - evaluates to true"] };
  }

  let evaluationResult = true;
  let failedCount = 0;

  // Sort conditions by order and evaluate
  const sortedConditions = conditions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  for (const condition of sortedConditions) {
    const fieldValue = entity[condition.field_name];
    const result = evaluateOperator(fieldValue, condition.operator, condition.value, condition.value_type);

    const logMsg = `Field '${condition.field_name}' ${condition.operator} '${condition.value}': ${result ? "✓" : "✗"}`;
    logs.push(logMsg);

    if (!result) {
      failedCount++;
      // AND logic: if any condition fails, evaluation fails
      if (condition.logic_operator === "AND") {
        evaluationResult = false;
        break;
      }
      // OR logic: continue checking other conditions
    }
  }

  // Log condition evaluation
  await supabase.from("automation_execution_logs").insert({
    execution_id: executionId,
    log_type: "condition_eval",
    message: `Evaluated ${conditions.length} conditions`,
    details: { conditions: logs, failed: failedCount },
    status: evaluationResult ? "success" : "failure",
  });

  return { passed: evaluationResult, failedCount, logs };
}

// ─────────────────────────────────────────────────────────────────────────────
// Action Execution Engine
// ─────────────────────────────────────────────────────────────────────────────

async function executeAction(
  entity: any,
  action: AutomationAction,
  ruleName: string,
  executionId: string,
  businessId: string
): Promise<{ success: boolean; message: string; actionId: string }> {
  const startTime = Date.now();

  try {
    // Log action start
    await supabase.from("automation_execution_logs").insert({
      execution_id: executionId,
      action_id: action.id,
      log_type: "action_start",
      message: `Starting action: ${action.action_type}`,
      details: { action_type: action.action_type, config: action.action_config },
      status: "pending",
    });

    const result = await executeActionByType(entity, action, ruleName, businessId);
    const duration = Date.now() - startTime;

    // Log action completion
    await supabase.from("automation_execution_logs").insert({
      execution_id: executionId,
      action_id: action.id,
      log_type: "action_complete",
      message: result.message,
      details: { duration_ms: duration, success: result.success },
      status: result.success ? "success" : "failure",
    });

    return { ...result, actionId: action.id };
  } catch (err) {
    const duration = Date.now() - startTime;

    // Log action error
    await supabase.from("automation_execution_logs").insert({
      execution_id: executionId,
      action_id: action.id,
      log_type: "action_error",
      message: String(err),
      details: { duration_ms: duration, error: String(err) },
      status: "failure",
    });

    return { success: false, message: `Action error: ${String(err)}`, actionId: action.id };
  }
}

async function executeActionByType(
  entity: any,
  action: AutomationAction,
  ruleName: string,
  businessId: string
): Promise<{ success: boolean; message: string }> {
  const config = action.action_config;

  switch (action.action_type) {
    case "send_email": {
      if (!resendApiKey) {
        return { success: false, message: "Email service not configured" };
      }

      // Get recipient email
      const recipientEmail = config.recipient_email || entity.email;
      if (!recipientEmail) {
        return { success: false, message: "Recipient email not found" };
      }

      // Interpolate template variables
      let subject = config.subject || `Automated: ${ruleName}`;
      let body = config.body || "";

      const variables = { name: entity.name || "Customer", ...entity };
      Object.entries(variables).forEach(([key, value]) => {
        const pattern = new RegExp(`{${key}}`, "g");
        subject = subject.replace(pattern, String(value || ""));
        body = body.replace(pattern, String(value || ""));
      });

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: config.from_email || "automation@noreply.example.com",
            to: recipientEmail,
            subject: subject,
            html: body,
            reply_to: config.reply_to || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, message: `Email sent to ${recipientEmail} (ID: ${data.id})` };
        } else {
          return { success: false, message: `Email send failed: ${response.statusText}` };
        }
      } catch (err) {
        return { success: false, message: `Email send error: ${String(err)}` };
      }
    }

    case "add_tag": {
      const tag = config.tag_name || config.tag;
      if (!tag) {
        return { success: false, message: "Tag name not configured" };
      }

      const { error } = await supabase
        .from("leads")
        .update({ tags: [tag] })
        .eq("id", entity.id);

      if (error) {
        return { success: false, message: `Tag add failed: ${error.message}` };
      }
      return { success: true, message: `Tag added: ${tag}` };
    }

    case "assign_user": {
      const assignedUserId = config.user_id || config.assigned_user_id;
      if (!assignedUserId) {
        return { success: false, message: "User ID not configured" };
      }

      const { error } = await supabase
        .from("leads")
        .update({ assigned_to: assignedUserId })
        .eq("id", entity.id);

      if (error) {
        return { success: false, message: `Assignment failed: ${error.message}` };
      }
      return { success: true, message: `Lead assigned to user ${assignedUserId}` };
    }

    case "update_field": {
      const fieldName = config.field_name;
      const fieldValue = config.field_value;

      if (!fieldName) {
        return { success: false, message: "Field name not configured" };
      }

      const fieldUpdate = { [fieldName]: fieldValue };
      const { error } = await supabase.from("leads").update(fieldUpdate).eq("id", entity.id);

      if (error) {
        return { success: false, message: `Field update failed: ${error.message}` };
      }
      return { success: true, message: `Field '${fieldName}' updated to '${fieldValue}'` };
    }

    case "create_task": {
      const taskTitle = config.task_title || `Task from rule: ${ruleName}`;
      const taskDescription = config.task_description || "";
      const assignedTo = config.assigned_to;

      // Note: Assumes task table structure
      const { error } = await supabase.from("tasks").insert({
        business_id: businessId,
        title: taskTitle,
        description: taskDescription,
        assigned_to: assignedTo || null,
        related_entity_id: entity.id,
        related_entity_type: "lead",
        status: "pending",
      });

      if (error) {
        return { success: false, message: `Task creation failed: ${error.message}` };
      }
      return { success: true, message: `Task created: ${taskTitle}` };
    }

    case "webhook": {
      const webhookUrl = config.webhook_url;
      if (!webhookUrl) {
        return { success: false, message: "Webhook URL not configured" };
      }

      try {
        const response = await fetch(webhookUrl, {
          method: config.method || "POST",
          headers: { "Content-Type": "application/json", ...config.headers },
          body: JSON.stringify({
            event: "automation_triggered",
            rule_name: ruleName,
            entity: entity,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          return { success: true, message: `Webhook executed successfully` };
        } else {
          return { success: false, message: `Webhook failed: ${response.statusText}` };
        }
      } catch (err) {
        return { success: false, message: `Webhook error: ${String(err)}` };
      }
    }

    default:
      return { success: false, message: `Unknown action type: ${action.action_type}` };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trigger Processing & Rule Evaluation
// ─────────────────────────────────────────────────────────────────────────────

async function processTrigger(payload: TriggerPayload): Promise<{
  success: boolean;
  execution_id?: string;
  results: ExecutionResult[];
}> {
  const executionStartTime = Date.now();
  const results: ExecutionResult[] = [];

  try {
    const { business_id, trigger_type, trigger_data, entity_id, entity_type } = payload;

    // Validate required fields
    if (!business_id || !trigger_type) {
      return {
        success: false,
        results: [{
          execution_id: "",
          rule_id: "",
          status: "failed",
          trigger_passed: false,
          conditions_passed: 0,
          conditions_failed: 0,
          actions_executed: 0,
          actions_failed: 0,
          errors: ["Missing business_id or trigger_type"],
          duration_ms: 0,
        }],
      };
    }

    // Get all active rules for this business and trigger type
    const { data: rules, error: rulesError } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("business_id", business_id)
      .eq("trigger_type", trigger_type)
      .eq("enabled", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      console.log(`No active rules found for trigger: ${trigger_type}`);
      return { success: true, results: [] };
    }

    // Get the entity that triggered this (usually a lead)
    const entityId = entity_id || trigger_data.id;
    if (!entityId) {
      return {
        success: false,
        results: [{
          execution_id: "",
          rule_id: "",
          status: "failed",
          trigger_passed: false,
          conditions_passed: 0,
          conditions_failed: 0,
          actions_executed: 0,
          actions_failed: 0,
          errors: ["Entity ID required in trigger data"],
          duration_ms: 0,
        }],
      };
    }

    // Fetch full entity details
    const table = entity_type || "leads";
    const { data: entity, error: entityError } = await supabase
      .from(table)
      .select("*")
      .eq("id", entityId)
      .single();

    if (entityError || !entity) {
      console.error(`Entity not found: ${table}/${entityId}`);
      return {
        success: false,
        results: [{
          execution_id: "",
          rule_id: "",
          status: "failed",
          trigger_passed: false,
          conditions_passed: 0,
          conditions_failed: 0,
          actions_executed: 0,
          actions_failed: 0,
          errors: [`Entity not found: ${entityId}`],
          duration_ms: 0,
        }],
      };
    }

    // Process each matching rule
    for (const rule of rules as AutomationRule[]) {
      const ruleStartTime = Date.now();

      // Create execution record
      const { data: executionData, error: executionError } = await supabase
        .from("automation_executions")
        .insert({
          rule_id: rule.id,
          business_id: business_id,
          trigger_type: trigger_type,
          entity_id: entityId,
          entity_type: entity_type || "lead",
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (executionError || !executionData) {
        console.error(`Failed to create execution record: ${executionError?.message}`);
        continue;
      }

      const executionId = executionData.id;

      // Log trigger evaluation
      await supabase.from("automation_execution_logs").insert({
        execution_id: executionId,
        log_type: "trigger_eval",
        message: `Trigger evaluated: ${trigger_type}`,
        details: { trigger_type, entity_id: entityId },
        status: "success",
      });

      try {
        // Get rule conditions
        const { data: conditions, error: conditionsError } = await supabase
          .from("automation_conditions")
          .select("*")
          .eq("rule_id", rule.id)
          .order("order_index", { ascending: true });

        if (conditionsError) throw conditionsError;

        // Evaluate conditions
        const conditionEval = await evaluateConditions(
          entity,
          (conditions || []) as AutomationCondition[],
          executionId,
          rule.id
        );

        if (!conditionEval.passed) {
          // Update execution as failed
          await supabase
            .from("automation_executions")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - ruleStartTime,
              result: {
                trigger_passed: true,
                conditions_passed: conditions?.length ? conditions.length - conditionEval.failedCount : 0,
                conditions_failed: conditionEval.failedCount,
                actions_executed: 0,
                actions_failed: 0,
                reason: "Conditions not met",
              },
            })
            .eq("id", executionId);

          results.push({
            execution_id: executionId,
            rule_id: rule.id,
            status: "completed",
            trigger_passed: true,
            conditions_passed: conditions?.length ? conditions.length - conditionEval.failedCount : 0,
            conditions_failed: conditionEval.failedCount,
            actions_executed: 0,
            actions_failed: 0,
            errors: [],
            duration_ms: Date.now() - ruleStartTime,
          });
          continue;
        }

        // Get and execute actions
        const { data: actions, error: actionsError } = await supabase
          .from("automation_actions")
          .select("*")
          .eq("rule_id", rule.id)
          .order("order_index", { ascending: true });

        if (actionsError) throw actionsError;
        if (!actions || actions.length === 0) {
          throw new Error("No actions configured for rule");
        }

        let actionsExecuted = 0;
        let actionsFailed = 0;
        const executionErrors: string[] = [];

        // Execute each action with delay support
        for (const action of actions as AutomationAction[]) {
          if (action.delay_seconds && action.delay_seconds > 0) {
            // In production, implement queued execution with delay
            console.log(`Action queued with ${action.delay_seconds}s delay`);
          }

          const actionResult = await executeAction(
            entity,
            action,
            rule.name,
            executionId,
            business_id
          );

          if (actionResult.success) {
            actionsExecuted++;
          } else {
            actionsFailed++;
            executionErrors.push(actionResult.message);
          }
        }

        // Update execution as completed
        const finalStatus = actionsFailed > 0 ? "partial_failure" : "completed";
        await supabase
          .from("automation_executions")
          .update({
            status: finalStatus,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - ruleStartTime,
            result: {
              trigger_passed: true,
              conditions_passed: conditions?.length || 0,
              conditions_failed: 0,
              actions_executed: actionsExecuted,
              actions_failed: actionsFailed,
              errors: executionErrors,
            },
          })
          .eq("id", executionId);

        // Update rule statistics
        await supabase
          .from("automation_rules")
          .update({
            total_runs: (rule.total_runs || 0) + 1,
            successful_runs: (rule.successful_runs || 0) + (actionsFailed === 0 ? 1 : 0),
            failed_runs: (rule.failed_runs || 0) + (actionsFailed > 0 ? 1 : 0),
            last_run_at: new Date().toISOString(),
          })
          .eq("id", rule.id);

        // Log execution completion
        await supabase.from("automation_execution_logs").insert({
          execution_id: executionId,
          log_type: "execution_complete",
          message: `Execution completed: ${actionsExecuted} actions executed, ${actionsFailed} failed`,
          details: {
            actions_executed: actionsExecuted,
            actions_failed: actionsFailed,
            errors: executionErrors,
          },
          status: actionsFailed === 0 ? "success" : "failure",
        });

        results.push({
          execution_id: executionId,
          rule_id: rule.id,
          status: finalStatus,
          trigger_passed: true,
          conditions_passed: conditions?.length || 0,
          conditions_failed: 0,
          actions_executed: actionsExecuted,
          actions_failed: actionsFailed,
          errors: executionErrors,
          duration_ms: Date.now() - ruleStartTime,
        });

        console.log(`Rule '${rule.name}' executed: ${actionsExecuted}/${actions.length} actions successful`);
      } catch (err) {
        const errorMsg = String(err);
        console.error(`Rule execution error for '${rule.name}': ${errorMsg}`);

        // Update execution as failed
        await supabase
          .from("automation_executions")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - ruleStartTime,
            result: { error: errorMsg },
          })
          .eq("id", executionId);

        // Log execution error
        await supabase.from("automation_execution_logs").insert({
          execution_id: executionId,
          log_type: "execution_complete",
          message: `Execution failed: ${errorMsg}`,
          details: { error: errorMsg },
          status: "failure",
        });

        results.push({
          execution_id: executionId,
          rule_id: rule.id,
          status: "failed",
          trigger_passed: true,
          conditions_passed: 0,
          conditions_failed: 0,
          actions_executed: 0,
          actions_failed: 0,
          errors: [errorMsg],
          duration_ms: Date.now() - ruleStartTime,
        });
      }
    }

    const totalDuration = Date.now() - executionStartTime;
    console.log(`Trigger processing completed in ${totalDuration}ms, ${results.length} rules evaluated`);

    return { success: true, results };
  } catch (err) {
    console.error("Trigger processing error:", err);
    return {
      success: false,
      results: [{
        execution_id: "",
        rule_id: "",
        status: "failed",
        trigger_passed: false,
        conditions_passed: 0,
        conditions_failed: 0,
        actions_executed: 0,
        actions_failed: 0,
        errors: [String(err)],
        duration_ms: Date.now() - executionStartTime,
      }],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Handler
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const body = (await req.json()) as TriggerPayload;

    if (!body.business_id || !body.trigger_type) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing business_id or trigger_type",
        }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const result = await processTrigger(body);

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: result.success ? 200 : 500,
    });
  } catch (err) {
    console.error("Automation execution error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: String(err),
        results: [],
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
