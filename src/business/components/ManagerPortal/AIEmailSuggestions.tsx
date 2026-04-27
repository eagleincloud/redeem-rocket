/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 3
 * AI Email Suggestions Component
 *
 * Displays AI-generated email drafts with:
 * - Email subject and body
 * - Confidence and personalization scores
 * - One-click usage or edit capabilities
 * - Manager modification tracking
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle, Edit2, Trash2, Send } from 'lucide-react';

interface EmailSuggestion {
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

interface AIEmailSuggestionsProps {
  suggestions: EmailSuggestion[];
  onUse?: (suggestion: EmailSuggestion) => Promise<void>;
  onModify?: (id: string, modifications: Partial<EmailSuggestion>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
  readonly?: boolean;
}

export const AIEmailSuggestions: React.FC<AIEmailSuggestionsProps> = ({
  suggestions = [],
  onUse,
  onModify,
  onDelete,
  loading = false,
  readonly = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleEditStart = (suggestion: EmailSuggestion) => {
    setEditingId(suggestion.id || '');
    setEditedSubject(suggestion.subjectLine);
    setEditedBody(suggestion.bodyText);
  };

  const handleEditSave = async (suggestion: EmailSuggestion) => {
    if (onModify && suggestion.id) {
      setSendingId(suggestion.id);
      try {
        await onModify(suggestion.id, {
          subjectLine: editedSubject,
          bodyText: editedBody,
          modifiedByManager: true,
        });
        setEditingId(null);
      } finally {
        setSendingId(null);
      }
    }
  };

  const handleUseEmail = async (suggestion: EmailSuggestion) => {
    if (onUse) {
      setSendingId(suggestion.id || '');
      try {
        await onUse(suggestion);
      } finally {
        setSendingId(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (onDelete && window.confirm('Delete this email suggestion?')) {
      await onDelete(id);
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      initial_outreach: '🚀 Initial Outreach',
      follow_up: '📬 Follow-Up',
      proposal: '📋 Proposal',
      negotiation: '🤝 Negotiation',
      close: '🎯 Close',
      objection_handling: '⚠️ Objection Handler',
      check_in: '👋 Check-In',
      next_step: '➡️ Next Step',
    };
    return labels[action] || action;
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">No Email Suggestions Yet</h3>
        <p className="text-blue-700">
          AI email suggestions will appear here once you generate recommendations for this deal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">AI-Generated Email Suggestions</h3>
        <span className="ml-auto text-sm text-gray-500">{suggestions.length} suggestions</span>
      </div>

      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.id || index}
          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Header with action label */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-600">
                  {getActionLabel(suggestion.suggestedAction)}
                </span>
                {suggestion.modifiedByManager && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                    Manager Modified
                  </span>
                )}
                {suggestion.used && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Used
                  </span>
                )}
              </div>
              {!readonly && (
                <div className="flex gap-2">
                  {editingId !== suggestion.id && (
                    <>
                      <button
                        onClick={() => handleEditStart(suggestion)}
                        disabled={loading || readonly}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                        title="Edit email"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(suggestion.id || '')}
                        disabled={loading || readonly}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete suggestion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Score indicators */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Confidence</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {Math.round(suggestion.confidenceScore * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
                    style={{ width: `${suggestion.confidenceScore * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Personalization</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {Math.round(suggestion.personalizationScore * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all"
                    style={{ width: `${suggestion.personalizationScore * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Email content - Edit or Display */}
          <div className="px-6 py-4 space-y-4">
            {editingId === suggestion.id ? (
              // Edit mode
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email subject..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Body
                  </label>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Email body..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditSave(suggestion)}
                    disabled={sendingId === suggestion.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {sendingId === suggestion.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              // Display mode
              <>
                <div>
                  <label className="block text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wider">
                    Subject
                  </label>
                  <p className="text-gray-900 font-semibold text-base">
                    {suggestion.subjectLine}
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wider">
                    Body
                  </label>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {suggestion.bodyText}
                  </p>
                </div>

                {!readonly && (
                  <div className="pt-2 flex gap-2 justify-end">
                    <button
                      onClick={() => handleUseEmail(suggestion)}
                      disabled={loading || sendingId === suggestion.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {sendingId === suggestion.id ? 'Sending...' : 'Use & Send'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
