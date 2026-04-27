/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 4
 * Escalation Workflow Component
 *
 * Handles:
 * - Escalation decision flow
 * - Reason documentation
 * - Manager/assignment selection
 * - Escalation history and tracking
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  RotateCw,
  MessageSquare,
  Clock,
  User,
  CheckCircle2,
  X,
} from 'lucide-react';

export interface EscalationRequest {
  id?: string;
  dealId: string;
  reason: string;
  context: string;
  priority: 'critical' | 'high' | 'medium';
  escalatedFrom?: string;
  escalatedTo?: string;
  aiTriggered: boolean;
  confidenceScore?: number;
}

interface EscalationWorkflowProps {
  deal?: {
    id: string;
    name: string;
    value: number;
    stage: string;
  };
  managers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  onEscalate?: (escalation: EscalationRequest) => Promise<void>;
  onCancel?: () => void;
  aiTriggered?: boolean;
  aiReason?: string;
  loading?: boolean;
}

type EscalationStep = 'reason' | 'escalate_to' | 'confirm';

export const EscalationWorkflow: React.FC<EscalationWorkflowProps> = ({
  deal,
  managers = [],
  onEscalate,
  onCancel,
  aiTriggered = false,
  aiReason = '',
  loading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<EscalationStep>('reason');
  const [reason, setReason] = useState('');
  const [context, setContext] = useState('');
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    if (aiTriggered && aiReason) {
      setReason(aiReason);
      setPriority('critical');
    }
  }, [aiTriggered, aiReason]);

  const handleEscalate = async () => {
    if (!deal || !selectedManager || !reason) {
      return;
    }

    setEscalating(true);
    try {
      if (onEscalate) {
        await onEscalate({
          dealId: deal.id,
          reason,
          context,
          priority,
          escalatedTo: selectedManager,
          aiTriggered,
          confidenceScore: aiTriggered ? 0.85 : undefined,
        });
      }
    } finally {
      setEscalating(false);
    }
  };

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 border-red-300 text-red-900',
    high: 'bg-orange-100 border-orange-300 text-orange-900',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  };

  const priorityIcons: Record<string, React.ReactNode> = {
    critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
    high: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    medium: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  };

  return (
    <div className="bg-white border-2 border-red-300 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">Escalate Deal</h3>
          {aiTriggered && (
            <p className="text-sm text-blue-600">
              🤖 AI-triggered escalation - high confidence
            </p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Deal Info */}
      {deal && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Deal</p>
          <p className="font-semibold text-gray-900">{deal.name}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-600">
            <span>${deal.value.toLocaleString()}</span>
            <span>•</span>
            <span className="capitalize">{deal.stage}</span>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        <div
          className={`flex items-center gap-2 ${
            currentStep === 'reason'
              ? 'text-blue-600'
              : 'text-gray-600'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === 'reason'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium">Reason</span>
        </div>

        <div className="h-1 flex-1 mx-2 bg-gray-200" />

        <div
          className={`flex items-center gap-2 ${
            currentStep === 'escalate_to'
              ? 'text-blue-600'
              : 'text-gray-600'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === 'escalate_to'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium">To Manager</span>
        </div>

        <div className="h-1 flex-1 mx-2 bg-gray-200" />

        <div
          className={`flex items-center gap-2 ${
            currentStep === 'confirm'
              ? 'text-blue-600'
              : 'text-gray-600'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep === 'confirm'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            3
          </div>
          <span className="text-sm font-medium">Confirm</span>
        </div>
      </div>

      {/* Step 1: Reason */}
      {currentStep === 'reason' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Priority Level
            </label>
            <div className="flex gap-3">
              {(['critical', 'high', 'medium'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    priority === p
                      ? `${priorityColors[p]} border-current`
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Escalation Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this deal being escalated?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={aiTriggered}
            />
            <p className="text-xs text-gray-500 mt-1">
              {aiTriggered
                ? '🤖 AI-generated reason'
                : 'Describe the situation requiring escalation'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Context
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any additional details about the deal or situation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setCurrentStep('escalate_to')}
            disabled={!reason}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
          >
            Continue to Manager Selection
          </button>
        </div>
      )}

      {/* Step 2: Select Manager */}
      {currentStep === 'escalate_to' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Escalate to Manager *
            </label>
            {managers.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
                <p>No other managers available in this business</p>
              </div>
            ) : (
              <div className="space-y-2">
                {managers.map((mgr) => (
                  <button
                    key={mgr.id}
                    onClick={() => setSelectedManager(mgr.id)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                      selectedManager === mgr.id
                        ? 'bg-red-50 border-red-500'
                        : 'bg-white border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {mgr.name}
                        </p>
                        <p className="text-sm text-gray-600">{mgr.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep('reason')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep('confirm')}
              disabled={!selectedManager}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
            >
              Continue to Confirm
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentStep === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-red-600 font-semibold uppercase">Priority</p>
              <div className="flex items-center gap-2 mt-1">
                {priorityIcons[priority]}
                <span className="font-semibold text-gray-900 capitalize">
                  {priority}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-red-600 font-semibold uppercase">Reason</p>
              <p className="text-gray-900 mt-1">{reason}</p>
            </div>

            {context && (
              <div>
                <p className="text-xs text-red-600 font-semibold uppercase">
                  Context
                </p>
                <p className="text-gray-900 mt-1">{context}</p>
              </div>
            )}

            {selectedManager && managers.length > 0 && (
              <div>
                <p className="text-xs text-red-600 font-semibold uppercase">
                  Escalating To
                </p>
                <p className="text-gray-900 mt-1 font-semibold">
                  {managers.find((m) => m.id === selectedManager)?.name}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep('escalate_to')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleEscalate}
              disabled={escalating || loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {escalating ? 'Escalating...' : 'Escalate Now'}
            </button>
          </div>
        </div>
      )}

      {/* Success State */}
      {escalating && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin mb-4">
              <RotateCw className="w-8 h-8 text-red-600 mx-auto" />
            </div>
            <p className="text-gray-600">Escalating deal...</p>
          </div>
        </div>
      )}
    </div>
  );
};
