/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 3
 * Confidence Factor Visualization Component
 *
 * Displays 5-factor confidence model:
 * 1. Deal Value Fit
 * 2. Customer Profile Match
 * 3. Sales Cycle Alignment
 * 4. Manager Success Rate
 * 5. Activity Momentum
 *
 * Uses radar chart and individual factor bars
 */

import React, { useMemo } from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface ConfidenceFactors {
  dealValueFit: number;
  customerProfileMatch: number;
  salesCycleAlignment: number;
  managerSuccessRate: number;
  activityMomentum: number;
  overallConfidence: number;
}

interface ConfidenceChartProps {
  factors: ConfidenceFactors;
  dealValue?: number;
  daysInactiveStage?: number;
}

export const ConfidenceChart: React.FC<ConfidenceChartProps> = ({
  factors,
  dealValue,
  daysInactiveStage,
}) => {
  const factorList = useMemo(
    () => [
      {
        label: 'Deal Value Fit',
        value: factors.dealValueFit,
        description: 'Is deal in ideal value range?',
        icon: '💰',
        color: 'from-emerald-500 to-teal-500',
      },
      {
        label: 'Customer Profile Match',
        value: factors.customerProfileMatch,
        description: 'Does customer match ideal profile?',
        icon: '👥',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        label: 'Sales Cycle Alignment',
        value: factors.salesCycleAlignment,
        description: 'Is deal at the right stage?',
        icon: '📈',
        color: 'from-purple-500 to-pink-500',
      },
      {
        label: 'Manager Success Rate',
        value: factors.managerSuccessRate,
        description: 'Historical success with similar deals',
        icon: '🎯',
        color: 'from-orange-500 to-red-500',
      },
      {
        label: 'Activity Momentum',
        value: factors.activityMomentum,
        description: 'Is engagement trending up?',
        icon: '⚡',
        color: 'from-yellow-500 to-orange-500',
      },
    ],
    [factors]
  );

  const overallScore = factors.overallConfidence;

  const getOverallScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreInterpretation = (score: number): string => {
    if (score >= 0.9) return '🌟 Excellent - High confidence in success';
    if (score >= 0.8) return '✅ Very Good - Strong indicators present';
    if (score >= 0.7) return '👍 Good - Positive signals overall';
    if (score >= 0.6) return '⚠️ Fair - Mixed signals, needs attention';
    if (score >= 0.5) return '❓ Moderate - Significant work required';
    return '⛔ Low - High risk, escalation recommended';
  };

  return (
    <div className="space-y-6">
      {/* Overall Confidence Score */}
      <div className={`border-2 rounded-lg p-6 ${getOverallScoreColor(overallScore)}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Overall Deal Confidence</h3>
          <span className="text-4xl font-bold">{Math.round(overallScore * 100)}%</span>
        </div>

        <p className="text-sm mb-4 font-medium">{getScoreInterpretation(overallScore)}</p>

        {/* Confidence gauge */}
        <div className="relative h-3 bg-white bg-opacity-50 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full transition-all duration-500`}
            style={{ width: `${overallScore * 100}%` }}
          />
        </div>
      </div>

      {/* Individual Factor Bars */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Confidence Factors Breakdown
        </h4>

        {factorList.map((factor, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{factor.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{factor.label}</p>
                    <p className="text-xs text-gray-600">{factor.description}</p>
                  </div>
                </div>
              </div>
              <span className="font-bold text-lg text-gray-900">
                {Math.round(factor.value * 100)}%
              </span>
            </div>

            {/* Confidence bar */}
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${factor.color} rounded-full transition-all duration-500`}
                style={{ width: `${factor.value * 100}%` }}
              />
            </div>

            {/* Mini interpretation */}
            <p className="text-xs text-gray-600">
              {factor.value >= 0.8
                ? '✅ Strong'
                : factor.value >= 0.6
                  ? '⚠️ Fair'
                  : '❌ Weak'}
            </p>
          </div>
        ))}
      </div>

      {/* Risk Indicators */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Risk Assessment
        </h4>

        <div className="space-y-2">
          {factors.activityMomentum < 0.4 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-600 font-bold mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-900">Activity Stalling</p>
                <p className="text-xs text-red-700 mt-1">
                  Deal is inactive. Recommend immediate outreach to re-engage.
                </p>
              </div>
            </div>
          )}

          {factors.dealValueFit < 0.5 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-600 font-bold mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-900">Deal Value Mismatch</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Deal value is outside optimal range. May impact close probability.
                </p>
              </div>
            </div>
          )}

          {factors.salesCycleAlignment < 0.5 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-yellow-600 font-bold mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-yellow-900">Sales Cycle Misalignment</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Deal stage and activity don't align. Clarify status with customer.
                </p>
              </div>
            </div>
          )}

          {factors.overallConfidence >= 0.8 && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Strong Deal Indicators</p>
                <p className="text-xs text-green-700 mt-1">
                  All signals are positive. Recommend accelerating close timeline.
                </p>
              </div>
            </div>
          )}

          {factors.overallConfidence < 0.5 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">High-Risk Deal</p>
                <p className="text-xs text-red-700 mt-1">
                  Multiple risk factors detected. Consider escalation or recovery plan.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Next Recommended Actions:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              {factors.activityMomentum < 0.3 && (
                <li>→ Send re-engagement email immediately</li>
              )}
              {factors.salesCycleAlignment > 0.8 && (
                <li>→ Move deal forward in negotiation</li>
              )}
              {factors.overallConfidence > 0.8 && (
                <li>→ Schedule closing call this week</li>
              )}
              <li>
                → Review customer fit against ideal profile monthly
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
