/**
 * FeatureDetailModal Component
 * Shows complete feature details, reviews, ratings, and actions
 */

import React, { memo, useState } from 'react';
import { X, Star, Download, Share2, MessageSquare } from 'lucide-react';
import type { FeatureCard } from '@/business/types/marketplace';
import { useFeatureRating } from '@/business/hooks/useFeatureRating';
import { useFeatureReview } from '@/business/hooks/useFeatureReview';
import { useFeatureUsage } from '@/business/hooks/useFeatureUsage';

interface FeatureDetailModalProps {
  feature: FeatureCard;
  businessId: string;
  onClose: () => void;
}

export const FeatureDetailModal = memo(function FeatureDetailModal({
  feature,
  businessId,
  onClose,
}: FeatureDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'details'>('overview');
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Hooks
  const rating = useFeatureRating(feature.id, businessId);
  const review = useFeatureReview(feature.id, businessId);
  const usage = useFeatureUsage(feature.id, businessId);

  // Handlers
  const handleRatingSubmit = async (value: 1 | 2 | 3 | 4 | 5) => {
    try {
      await rating.submitRating(value);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const handleToggle = async () => {
    try {
      await usage.toggle();
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const handleReviewSubmit = async (reviewText: string) => {
    try {
      await review.submitReview(reviewText);
      setShowReviewForm(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              {feature.icon_url ? (
                <img src={feature.icon_url} alt={feature.feature_name} className="h-8 w-8" />
              ) : null}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">{feature.feature_name}</h2>
              <p className="text-sm text-gray-600">{feature.category}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          {(['overview', 'reviews', 'details'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'reviews' && <MessageSquare className="h-4 w-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">About</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Adoption Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{feature.adoption_rate.toFixed(1)}%</p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{feature.average_rating.toFixed(1)}</p>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{feature.total_reviews}</p>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Your Rating</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleRatingSubmit(value as 1 | 2 | 3 | 4 | 5)}
                      className="transition-transform hover:scale-110"
                      disabled={rating.isSaving}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          (feature.userRating || 0) >= value
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {!showReviewForm && !review.hasReviewed && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
                >
                  Write a Review
                </button>
              )}

              {showReviewForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = e.currentTarget.review.value;
                    handleReviewSubmit(text);
                  }}
                  className="space-y-3 rounded-lg border border-gray-200 p-4"
                >
                  <textarea
                    name="review"
                    placeholder="Share your experience with this feature..."
                    maxLength={500}
                    className="w-full rounded border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={review.isSaving}
                      className="flex-1 rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 rounded bg-gray-200 py-2 font-medium text-gray-800 hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {review.otherReviews.map((rev) => (
                  <div key={rev.id} className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-900">{rev.review_text}</p>
                    {rev.use_case_tag && (
                      <p className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
                        {rev.use_case_tag}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">Status</h3>
                <p className="text-gray-700">{feature.status.replace('_', ' ')}</p>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900">Category</h3>
                <p className="text-gray-700">{feature.category}</p>
              </div>

              {usage.usage && (
                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">Usage</h3>
                  <p className="text-gray-700">
                    Used {usage.usage.usage_count} times
                    {usage.usage.last_used_at
                      ? ` - Last used ${new Date(usage.usage.last_used_at).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-200 bg-gray-50 p-6">
          <button
            onClick={handleToggle}
            disabled={usage.isSaving}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 font-medium transition-colors disabled:opacity-50 ${
              usage.isEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <Download className="h-4 w-4" />
            {usage.isEnabled ? 'Disable' : 'Enable'}
          </button>

          <button className="flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300">
            <Share2 className="h-4 w-4" />
            Share
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
