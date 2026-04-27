/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 4
 * Action Items Manager Component
 *
 * Handles:
 * - Create, edit, complete action items
 * - Priority and due date management
 * - AI-suggested actions
 * - Progress tracking
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
} from 'lucide-react';

export interface ActionItem {
  id?: string;
  title: string;
  description?: string;
  actionType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueAt: string;
  scheduledFor?: string;
  aiSuggested?: boolean;
  createdAt?: string;
  completedAt?: string;
}

interface ActionItemsManagerProps {
  dealId: string;
  items?: ActionItem[];
  onAdd?: (item: ActionItem) => Promise<void>;
  onUpdate?: (id: string, changes: Partial<ActionItem>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  readOnly?: boolean;
  loading?: boolean;
  maxItems?: number;
}

const ActionTypeEmojis: Record<string, string> = {
  send_email: '📧',
  schedule_call: '📞',
  send_proposal: '📋',
  follow_up: '📬',
  negotiate: '🤝',
  close: '🎯',
  check_in: '👋',
  other: '→',
};

export const ActionItemsManager: React.FC<ActionItemsManagerProps> = ({
  dealId,
  items = [],
  onAdd,
  onUpdate,
  onDelete,
  onComplete,
  readOnly = false,
  loading = false,
  maxItems = 5,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ActionItem>>({
    title: '',
    description: '',
    actionType: 'follow_up',
    priority: 'medium',
    status: 'pending',
  });

  const handleAddOrUpdate = async () => {
    if (!formData.title) return;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // Default to 3 days from now

    const item: ActionItem = {
      id: editingId || undefined,
      title: formData.title,
      description: formData.description,
      actionType: formData.actionType || 'follow_up',
      priority: formData.priority || 'medium',
      status: formData.status || 'pending',
      dueAt: formData.dueAt || dueDate.toISOString(),
      scheduledFor: formData.scheduledFor,
    };

    if (editingId && onUpdate) {
      await onUpdate(editingId, item);
    } else if (onAdd) {
      await onAdd(item);
    }

    setFormData({
      title: '',
      description: '',
      actionType: 'follow_up',
      priority: 'medium',
      status: 'pending',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (onDelete && window.confirm('Delete this action item?')) {
      await onDelete(id);
    }
  };

  const handleComplete = async (id: string) => {
    if (onComplete) {
      await onComplete(id);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      default:
        return '🔵';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const isOverdue = (dueAt: string) => {
    return new Date(dueAt) < new Date();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const pendingCount = items.filter(
    (i) => i.status === 'pending' || i.status === 'in_progress'
  ).length;
  const overdueCount = items.filter(
    (i) =>
      (i.status === 'pending' || i.status === 'in_progress') &&
      isOverdue(i.dueAt)
  ).length;

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Action Items
        </h3>
        <div className="flex items-center gap-4 text-sm">
          {completedCount > 0 && (
            <span className="text-green-600 font-medium">
              {completedCount} completed
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-yellow-600 font-medium">
              {pendingCount} pending
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {overdueCount} overdue
            </span>
          )}
        </div>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`border-2 rounded-lg p-4 transition-all ${getPriorityColor(
                item.priority
              )}`}
            >
              <div className="flex items-start gap-3">
                {/* Status circle */}
                <button
                  onClick={() => handleComplete(item.id || '')}
                  disabled={item.status === 'completed' || readOnly}
                  className="flex-shrink-0 mt-1 hover:scale-110 transition-transform"
                >
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          item.status === 'completed'
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {ActionTypeEmojis[item.actionType] || '→'} {item.title}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {!readOnly && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingId(item.id || null);
                            setFormData(item);
                            setShowForm(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || '')}
                          className="p-1 hover:bg-red-200 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span
                      className="px-2 py-1 bg-white bg-opacity-50 rounded font-medium"
                    >
                      {getPriorityIcon(item.priority)} {item.priority}
                    </span>

                    {isOverdue(item.dueAt) && (
                      <span className="px-2 py-1 bg-red-200 text-red-900 rounded font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-gray-700">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.dueAt)}
                    </span>

                    {item.aiSuggested && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Sparkles className="w-3 h-3" />
                        AI suggested
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm && !readOnly && (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Action title (e.g., Send proposal)"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <textarea
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={formData.priority || 'medium'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as any,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🔵 Low</option>
            </select>

            <select
              value={formData.actionType || 'follow_up'}
              onChange={(e) =>
                setFormData({ ...formData, actionType: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="send_email">📧 Send Email</option>
              <option value="schedule_call">📞 Schedule Call</option>
              <option value="send_proposal">📋 Send Proposal</option>
              <option value="follow_up">📬 Follow Up</option>
              <option value="negotiate">🤝 Negotiate</option>
              <option value="close">🎯 Close</option>
              <option value="check_in">👋 Check In</option>
              <option value="other">→ Other</option>
            </select>
          </div>

          <input
            type="date"
            value={formData.dueAt ? formData.dueAt.split('T')[0] : ''}
            onChange={(e) => {
              const date = new Date(e.target.value);
              date.setUTCHours(0, 0, 0, 0);
              setFormData({
                ...formData,
                dueAt: date.toISOString(),
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  title: '',
                  description: '',
                  actionType: 'follow_up',
                  priority: 'medium',
                  status: 'pending',
                });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddOrUpdate}
              disabled={!formData.title || loading}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm"
            >
              {editingId ? 'Update' : 'Add'} Action Item
            </button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showForm && !readOnly && items.length < maxItems && (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
          }}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Action Item
        </button>
      )}

      {/* Empty State */}
      {items.length === 0 && !showForm && (
        <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-2">No action items yet</p>
          {!readOnly && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first action item
            </button>
          )}
        </div>
      )}
    </div>
  );
};
