/**
 * useMarketplaceFeatures Hook
 * Manages feature browsing, searching, and filtering
 */

import { useCallback, useMemo, useState } from 'react';
import type { FeatureCard, FeatureBrowseFilters, FeatureSearchResult } from '@/business/types/marketplace';
import { getFeatures, searchFeatures, getTrendingFeatures } from '@/business/services/marketplace/feature-catalog';

interface UseMarketplaceFeaturesState {
  features: FeatureCard[];
  total: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function useMarketplaceFeatures(businessId: string, initialFilters?: FeatureBrowseFilters) {
  const [state, setState] = useState<UseMarketplaceFeaturesState>({
    features: [],
    total: 0,
    isLoading: false,
    error: null,
    page: 0,
    pageSize: initialFilters?.pageSize || 12,
    hasMore: false,
  });

  const [filters, setFilters] = useState<FeatureBrowseFilters>(initialFilters || {});

  /**
   * Load features based on current filters
   */
  const loadFeatures = useCallback(
    async (pageNum: number = 0) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await getFeatures(businessId, {
          ...filters,
          page: pageNum,
          pageSize: state.pageSize,
        });

        setState((prev) => ({
          ...prev,
          features: result.features,
          total: result.total,
          page: pageNum,
          hasMore: result.hasMore,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to load features',
          isLoading: false,
        }));
      }
    },
    [businessId, filters, state.pageSize],
  );

  /**
   * Search features with query
   */
  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadFeatures(0);
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const results = await searchFeatures(query, businessId);
        setState((prev) => ({
          ...prev,
          features: results,
          total: results.length,
          page: 0,
          hasMore: false,
          isLoading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Search failed',
          isLoading: false,
        }));
      }
    },
    [businessId, loadFeatures],
  );

  /**
   * Load trending features
   */
  const loadTrending = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const results = await getTrendingFeatures(businessId);
      setState((prev) => ({
        ...prev,
        features: results,
        total: results.length,
        page: 0,
        hasMore: false,
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to load trending features',
        isLoading: false,
      }));
    }
  }, [businessId]);

  /**
   * Update filters and reload
   */
  const updateFilters = useCallback(
    (newFilters: FeatureBrowseFilters) => {
      setFilters(newFilters);
      // Load with updated filters on next render
    },
    [],
  );

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (state.hasMore) {
      loadFeatures(state.page + 1);
    }
  }, [state.page, state.hasMore, loadFeatures]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (state.page > 0) {
      loadFeatures(state.page - 1);
    }
  }, [state.page, loadFeatures]);

  return useMemo(
    () => ({
      ...state,
      filters,
      setFilters: updateFilters,
      loadFeatures,
      search,
      loadTrending,
      nextPage,
      prevPage,
      reset: () => {
        setFilters({});
        loadFeatures(0);
      },
    }),
    [state, filters, updateFilters, loadFeatures, search, loadTrending, nextPage, prevPage],
  );
}
