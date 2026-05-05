/**
 * Layer 7: AI + Manager Layer Types
 * Manager portal, AI recommendations, and hybrid support system
 */

// Manager Assignment
export interface ManagerAssignment {
  id: string;
  manager_id: string;
  lead_id: string;
  assigned_at: string;
  unassigned_at: string | null;
  reason: string;
}

// AI Recommendation
export interface AIRecommendation {
  id: string;
  business_id: string;
  manager_id: string | null;
  lead_id: string | null;

  type: 'lead_health' | 'action_suggestion' | 'coaching' | 'escalation';
  title: string;
  description: string;

  urgency: 'high' | 'medium' | 'low';
  confidence_score: number; // 0-100

  action_type: string;
  action_url?: string;
  action_params?: Record<string, any>;

  actioned_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

// Manager Task
export interface ManagerTask {
  id: string;
  manager_id: string;
  lead_id?: string;
  deal_id?: string;

  title: string;
  description?: string;
  task_type: 'follow_up' | 'call' | 'email' | 'meeting' | 'proposal' | 'negotiation';

  due_date?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  completed_at?: string;
  created_at: string;
}

// Manager Portal Data
export interface ManagerPortalData {
  assigned_leads: Array<{
    id: string;
    name: string;
    company: string;
    stage: string;
    days_in_stage: number;
    value: number;
    health_score: number;
  }>;
  pending_tasks: ManagerTask[];
  ai_recommendations: AIRecommendation[];
  performance_stats: {
    total_conversions: number;
    conversion_rate: number;
    avg_deal_size: number;
    response_time: number;
  };
}

// Lead Health Score
export interface LeadHealthScore {
  id: string;
  lead_id: string;
  business_id: string;

  health_score: number; // 0-100
  risk_level: 'high' | 'medium' | 'low';

  last_activity_days_ago: number;
  engagement_level: 'high' | 'medium' | 'low';
  activity_trend: 'increasing' | 'stable' | 'decreasing';

  reasons: Array<{
    reason: string;
    weight: number;
  }>;

  calculated_at: string;
}

// Email Draft (AI-generated)
export interface EmailDraft {
  id: string;
  lead_id: string;
  manager_id: string;
  template_type: string;

  subject: string;
  body: string;

  confidence_score: number;
  alternatives?: Array<{
    subject: string;
    body: string;
  }>;

  sent_at?: string;
  open_rate?: number;
  click_rate?: number;

  created_at: string;
}

// Manager Interaction Log
export interface ManagerInteraction {
  id: string;
  manager_id: string;
  lead_id: string;
  interaction_type: 'email' | 'call' | 'meeting' | 'note' | 'proposal' | 'document';

  details: Record<string, any>;
  outcome?: string;
  next_action?: string;

  created_at: string;
}
