/**
 * FeatureRequestForm Component
 * Allows users to submit feature requests with details
 */

import React, { memo, useState } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

interface FeatureRequestFormProps {
  businessId: string;
  onClose?: () => void;
  onSubmit?: () => void;
}

export const FeatureRequestForm = memo(function FeatureRequestForm({
  businessId,
  onClose,
  onSubmit,
}: FeatureRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    feature_name: '',
    description: '',
    use_case: '',
    expected_impact: 'high',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('feature_requests')
        .insert([
          {
            business_id: businessId,
            feature_name: formData.feature_name,
            description: formData.description,
            use_case: formData.use_case,
            expected_impact: formData.expected_impact,
            status: 'open',
            vote_count: 1,
            voter_ids: [businessId],
          },
        ]);

      if (submitError) {
        setError(submitError.message);
      } else {
        setSuccess(true);
        setFormData({
          feature_name: '',
          description: '',
          use_case: '',
          expected_impact: 'high',
        });
        setTimeout(() => {
          onSubmit?.();
          onClose?.();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Send className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Request Submitted</h3>
          <p className="text-gray-600">Your feature request has been received and will be reviewed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Request a Feature</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
            title="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Feature Name</label>
          <input
            type="text"
            required
            value={formData.feature_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, feature_name: e.target.value }))
            }
            placeholder="What feature would you like?"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe the feature in detail"
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Use Case</label>
          <textarea
            value={formData.use_case}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, use_case: e.target.value }))
            }
            placeholder="How would you use this feature?"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Expected Impact</label>
          <select
            value={formData.expected_impact}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, expected_impact: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
          >
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
          </select>
        </div>

        <div className="flex gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
});
