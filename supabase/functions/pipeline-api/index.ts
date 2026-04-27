// Supabase Edge Function: Pipeline API
// Handles CRUD operations for pipelines, pipeline entities, and stage transitions
//
// Deploy: supabase functions deploy pipeline-api
// Secrets:
//   SUPABASE_URL         (auto-injected)
//   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
//
// Invoke: POST /functions/v1/pipeline-api
// Body: { action: string, data: {...} }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface PipelineRequest {
  action: string;
  data: Record<string, unknown>;
}

interface Stage {
  id: number;
  name: string;
  color: string;
  order: number;
}

interface EntityData {
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

// ── Response Helper ───────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

// ── Pipeline Operations ───────────────────────────────────────────────────

async function createPipeline(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    const { business_id, name, pipeline_type = 'custom', stages, created_by } = data;

    if (!business_id || !name || !stages) {
      return error('Missing required fields: business_id, name, stages');
    }

    if (!Array.isArray(stages) || stages.length === 0) {
      return error('Stages must be a non-empty array');
    }

    const { data: pipeline, error: err } = await supabase
      .from('business_pipelines')
      .insert({
        business_id,
        name,
        pipeline_type,
        stages: stages as Stage[],
        created_by: created_by || business_id,
      })
      .select()
      .single();

    if (err) return error(err.message, 400);
    return json({ pipeline }, 201);
  } catch (e) {
    return error(String(e), 500);
  }
}

async function getPipelines(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    const { business_id, type, is_active = true } = data;
    if (!business_id) return error('Missing business_id');

    let query = supabase
      .from('business_pipelines')
      .select('*')
      .eq('business_id', business_id);

    if (type) query = query.eq('pipeline_type', type);
    if (is_active !== undefined) query = query.eq('is_active', is_active);

    const { data: pipelines, error: err } = await query.order('created_at', { ascending: false });

    if (err) return error(err.message, 400);
    return json({ pipelines });
  } catch (e) {
    return error(String(e), 500);
  }
}

async function updatePipeline(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    const { pipeline_id, ...updateData } = data;
    if (!pipeline_id) return error('Missing pipeline_id');

    const { data: pipeline, error: err } = await supabase
      .from('business_pipelines')
      .update(updateData)
      .eq('id', pipeline_id)
      .select()
      .single();

    if (err) return error(err.message, 400);
    return json({ pipeline });
  } catch (e) {
    return error(String(e), 500);
  }
}

// ── Pipeline Entity Operations ────────────────────────────────────────────

async function createPipelineEntity(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    const {
      business_id,
      pipeline_id,
      entity_type,
      entity_id,
      entity_data,
      current_stage_id,
      current_stage_name,
      created_by,
    } = data;

    if (!business_id || !pipeline_id || !entity_type || !current_stage_id) {
      return error('Missing required fields: business_id, pipeline_id, entity_type, current_stage_id');
    }

    const { data: entity, error: err } = await supabase
      .from('pipeline_entities')
      .insert({
        business_id,
        pipeline_id,
        entity_type,
        entity_id,
        entity_data: entity_data || {},
        current_stage_id,
        current_stage_name: current_stage_name || '',
        stage_history: [
          {
            stage_id: current_stage_id,
            stage_name: current_stage_name,
            entered_at: new Date().toISOString(),
          },
        ],
        created_by: created_by || business_id,
      })
      .select()
      .single();

    if (err) return error(err.message, 400);
    return json({ entity }, 201);
  } catch (e) {
    return error(String(e), 500);
  }
}

async function getPipelineEntities(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    const { pipeline_id, stage_id, limit = 100, offset = 0 } = data;
    if (!pipeline_id) return error('Missing pipeline_id');

    let query = supabase
      .from('pipeline_entities')
      .select('*')
      .eq('pipeline_id', pipeline_id)
      .eq('is_active', true);

    if (stage_id !== undefined) query = query.eq('current_stage_id', stage_id);

    const { data: entities, error: err } = await query
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (err) return error(err.message, 400);
    return json({ entities });
  } catch (e) {
    return error(String(e), 500);
  }
}

async function movePipelineEntity(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    const { entity_id, new_stage_id, new_stage_name, transition_reason, triggered_by = 'manual', transition_by } = data;

    if (!entity_id || !new_stage_id) {
      return error('Missing required fields: entity_id, new_stage_id');
    }

    // Get current entity
    const { data: entityData, error: getErr } = await supabase
      .from('pipeline_entities')
      .select('*')
      .eq('id', entity_id)
      .single();

    if (getErr || !entityData) return error('Entity not found', 404);

    // Update stage history
    const stageHistory = Array.isArray(entityData.stage_history) ? entityData.stage_history : [];
    const updatedStageHistory = [
      ...stageHistory,
      {
        stage_id: new_stage_id,
        stage_name: new_stage_name,
        entered_at: new Date().toISOString(),
        exited_at: null,
      },
    ];

    // Update entity
    const { data: updated, error: updateErr } = await supabase
      .from('pipeline_entities')
      .update({
        current_stage_id: new_stage_id,
        current_stage_name: new_stage_name,
        stage_history: updatedStageHistory,
        entered_current_stage_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', entity_id)
      .select()
      .single();

    if (updateErr) return error(updateErr.message, 400);

    // Log transition
    await supabase.from('pipeline_stage_transitions').insert({
      business_id: entityData.business_id,
      pipeline_entity_id: entity_id,
      from_stage_id: entityData.current_stage_id,
      from_stage_name: entityData.current_stage_name,
      to_stage_id: new_stage_id,
      to_stage_name: new_stage_name,
      transition_reason: transition_reason || '',
      triggered_by,
      transition_by: transition_by || entityData.created_by,
    });

    return json({ entity: updated });
  } catch (e) {
    return error(String(e), 500);
  }
}

// ── Pipeline Stats Operations ─────────────────────────────────────────────

async function getPipelineStats(supabase: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  try {
    const { pipeline_id } = data;
    if (!pipeline_id) return error('Missing pipeline_id');

    // Get pipeline with stages
    const { data: pipeline, error: pipelineErr } = await supabase
      .from('business_pipelines')
      .select('stages')
      .eq('id', pipeline_id)
      .single();

    if (pipelineErr || !pipeline) return error('Pipeline not found', 404);

    const stages = Array.isArray(pipeline.stages) ? pipeline.stages : [];

    // Calculate stats per stage
    const stats: Record<number, { stage_id: number; stage_name: string; count: number; conversion_rate: number; avg_cycle_days: number }> = {};

    for (const stage of stages) {
      const stageId = (stage as Stage).id;
      const stageName = (stage as Stage).name;

      // Count entities in this stage
      const { count, error: countErr } = await supabase
        .from('pipeline_entities')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline_id', pipeline_id)
        .eq('current_stage_id', stageId);

      if (countErr) continue;

      // Calculate average cycle time
      const { data: entities, error: entErr } = await supabase
        .from('pipeline_entities')
        .select('days_in_current_stage, total_cycle_days')
        .eq('pipeline_id', pipeline_id)
        .eq('current_stage_id', stageId);

      let avgCycleDays = 0;
      if (!entErr && entities && entities.length > 0) {
        const totalCycleDays = entities.reduce((sum, e) => sum + (Number(e.total_cycle_days) || 0), 0);
        avgCycleDays = totalCycleDays / entities.length;
      }

      stats[stageId] = {
        stage_id: stageId,
        stage_name: stageName,
        count: count || 0,
        conversion_rate: 0,
        avg_cycle_days: avgCycleDays,
      };
    }

    return json({ stats: Object.values(stats) });
  } catch (e) {
    return error(String(e), 500);
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return error('Only POST allowed', 405);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const body: PipelineRequest = await req.json();
    const { action, data } = body;

    if (!action) return error('Missing action');
    if (!data) return error('Missing data');

    // Route to appropriate handler
    switch (action) {
      case 'createPipeline':
        return createPipeline(supabase, data);
      case 'getPipelines':
        return getPipelines(supabase, data);
      case 'updatePipeline':
        return updatePipeline(supabase, data);
      case 'createPipelineEntity':
        return createPipelineEntity(supabase, data);
      case 'getPipelineEntities':
        return getPipelineEntities(supabase, data);
      case 'movePipelineEntity':
        return movePipelineEntity(supabase, data);
      case 'getPipelineStats':
        return getPipelineStats(supabase, data);
      default:
        return error(`Unknown action: ${action}`, 400);
    }
  } catch (e) {
    return error(`Invalid request: ${String(e)}`, 400);
  }
});
