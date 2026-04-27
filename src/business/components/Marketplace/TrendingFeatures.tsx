/**
 * TrendingFeatures Component
 * Displays leaderboard of top voted/trending features
 */

import React, { memo, useEffect, useState } from 'react';
import { TrendingUp, Loader, Trophy, Star } from 'lucide-react';
import { supabase } from '@/app/supabase';

interface TrendingFeature {
  id: string;
  feature_name: string;
  feature_slug: string;
  votes_count: number;
  average_rating: number;
  adoption_rate: number;
  trending_score?: number;
}

interface TrendingFeaturesProps {
  limit?: number;
  category?: string;
  onSelectFeature?: (featureId: string) => void;
}

const getMedalEmoji = (position: number) => {
  if (position === 1) return '🥇';
  if (position === 2) return '🥈';
  if (position === 3) return '🥉';
  return `${position}`;
};

export const TrendingFeatures = memo(function TrendingFeatures({
  limit = 10,
  category,
  onSelectFeature,
}: TrendingFeaturesProps) {
  const [features, setFeatures] = useState<TrendingFeature[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTrendingFeatures = async () => {
      setLoading(true);
      try {
        // Get trending features using the database function
        const { data, error } = await supabase.rpc('get_trending_features', {
          limit_count: limit,
          category_filter: category || null,
        });

        if (!error && data) {
          setFeatures(data as TrendingFeature[]);
        }
      } catch (err) {
        console.error('Failed to load trending features:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingFeatures();
  }, [limit, category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <TrendingUp className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        <p className="text-gray-600">No trending features yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-gray-900">Trending Features</h3>
      </div>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <div
            key={feature.id}
            onClick={() => onSelectFeature?.(feature.id)}
            className={`flex cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-all hover:shadow-md ${
              onSelectFeature ? 'hover:bg-gray-50' : ''
            }`}
          >
            {/* Position Medal */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-sm font-bold">
              {getMedalEmoji(index + 1)}
            </div>

            {/* Feature Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900">{feature.feature_name}</h4>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-600">
                {feature.votes_count > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                    <TrendingUp className="h-3 w-3" />
                    {feature.votes_count} votes
                  </span>
                )}
                {feature.average_rating > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-yellow-700">
                    <Star className="h-3 w-3 fill-current" />
                    {feature.average_rating.toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-green-700">
                  {feature.adoption_rate.toFixed(1)}% adopted
                </span>
              </div>
            </div>

            {/* Trending Score */}
            {feature.trending_score !== undefined && (
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500">Trending Score</div>
                <div className="text-lg font-bold text-blue-600">
                  {feature.trending_score.toFixed(1)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
