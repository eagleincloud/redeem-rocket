/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 3
 * Hook for AI Manager Layer functionality
 *
 * Provides:
 * - Email suggestion generation via Claude Haiku
 * - Confidence factor calculation
 * - Manager recommendations
 * - Escalation detection
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';

export interface DealContext {
  dealId: string;
  businessId: string;
  managerId: string;
  customerName?: string;
  companyName?: string;
  dealValue?: number;
  stage?: string;
  lastActivity?: string;
  daysSinceActivity?: number;
  dealHistory?: string;
}

export interface EmailSuggestion {
  id?: string;
  subjectLine: string;
  bodyText: string;
  suggestedAction: string;
  confidenceScore: number;
  personalizationScore: number;
  reviewed?: boolean;
  used?: boolean;
  modifiedByManager?: boolean;
}

export interface ConfidenceFactors {
  dealValueFit: number;
  customerProfileMatch: number;
  salesCycleAlignment: number;
  managerSuccessRate: number;
  activityMomentum: number;
  overallConfidence: number;
}

export interface ManagerRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  estimatedOutcome: string;
}

interface AIManagerLayerResponse {
  emailSuggestions: EmailSuggestion[];
  confidenceFactors: ConfidenceFactors;
  recommendations: ManagerRecommendation[];
  timestamp: string;
}

export const useAIManagerLayer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<EmailSuggestion[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceFactors | null>(null);
  const [recommendations, setRecommendations] = useState<ManagerRecommendation[]>([]);

  const generateEmailSuggestions = useCallback(
    async (context: DealContext): Promise<AIManagerLayerResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await supabase.functions.invoke(
          'ai-manager-layer',
          {
            body: {
              dealId: context.dealId,
              businessId: context.businessId,
              managerId: context.managerId,
              context: {
                customerName: context.customerName,
                companyName: context.companyName,
                dealValue: context.dealValue,
                stage: context.stage,
                lastActivity: context.lastActivity,
                daysSinceActivity: context.daysSinceActivity,
                dealHistory: context.dealHistory,
              },
            },
          }
        );

        if (response.error) {
          setError(response.error.message || 'Failed to generate suggestions');
          return null;
        }

        const data = response.data as AIManagerLayerResponse;

        // Store results in state
        setSuggestions(data.emailSuggestions);
        setConfidence(data.confidenceFactors);
        setRecommendations(data.recommendations);

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const useSuggestion = useCallback(
    async (suggestion: EmailSuggestion): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Update suggestion as used
        const { error: updateError } = await supabase
          .from('ai_email_suggestions')
          .update({
            used: true,
            reviewed: true,
            sent_at: new Date().toISOString(),
          })
          .eq('id', suggestion.id);

        if (updateError) {
          setError(updateError.message);
          return false;
        }

        // TODO: Integrate with email sending service (Resend)
        // For now, just mark as used in database
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const modifySuggestion = useCallback(
    async (
      id: string,
      modifications: Partial<EmailSuggestion>
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from('ai_email_suggestions')
          .update({
            subject_line: modifications.subjectLine,
            body_text: modifications.bodyText,
            modified_by_manager: true,
            manager_modifications: JSON.stringify(modifications),
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) {
          setError(updateError.message);
          return false;
        }

        // Update local state
        setSuggestions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, ...modifications, modifiedByManager: true } : s
          )
        );

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteSuggestion = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('ai_email_suggestions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      // Update local state
      setSuggestions((prev) => prev.filter((s) => s.id !== id));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createActionItem = useCallback(
    async (
      dealId: string,
      businessId: string,
      managerId: string,
      action: ManagerRecommendation
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        // Map recommendation action to action_item action_type
        const actionTypeMap: Record<string, string> = {
          send_outreach_email: 'send_email',
          send_proposal_follow_up: 'send_email',
          schedule_call: 'schedule_call',
          send_proposal: 'send_email',
          accelerate_close: 'close',
          escalate_or_reclaim: 'follow_up',
          negotiate_terms: 'negotiate',
          gather_requirements: 'other',
          conduct_demo: 'other',
          get_decision_maker: 'other',
          handle_objection: 'other',
        };

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow by default

        const { error: insertError } = await supabase
          .from('manager_action_items')
          .insert({
            business_id: businessId,
            manager_id: managerId,
            deal_id: dealId,
            action_type: actionTypeMap[action.action] || 'other',
            title: action.action
              .split('_')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
            description: action.rationale,
            due_at: dueDate.toISOString(),
            priority:
              action.priority === 'critical'
                ? 'critical'
                : action.priority === 'high'
                  ? 'high'
                  : action.priority === 'medium'
                    ? 'medium'
                    : 'low',
            ai_suggested: true,
            ai_suggestion_text: action.estimatedOutcome,
          });

        if (insertError) {
          setError(insertError.message);
          return false;
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const dismissRecommendation = useCallback(
    async (dealId: string, businessId: string, action: string): Promise<boolean> => {
      // Store dismissal in a dismissed_recommendations table (or similar)
      // For now, just remove from local state
      setRecommendations((prev) => prev.filter((r) => r.action !== action));
      return true;
    },
    []
  );

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return {
    loading,
    error,
    suggestions,
    confidence,
    recommendations,
    generateEmailSuggestions,
    useSuggestion,
    modifySuggestion,
    deleteSuggestion,
    createActionItem,
    dismissRecommendation,
    getConfidenceColor,
  };
};
