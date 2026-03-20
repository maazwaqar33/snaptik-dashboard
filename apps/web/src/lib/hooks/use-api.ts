'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AxiosError } from 'axios';

interface UseApiResult<T> {
  data:    T | undefined;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

/**
 * Typed wrapper around useQuery + apiClient.
 * Provides consistent data/loading/error shape across all pages.
 *
 * @example
 *   const { data, loading, error } = useApi<User[]>('/users');
 */
export function useApi<T>(
  path:    string,
  options?: Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>,
): UseApiResult<T> {
  const { data, isLoading, error, refetch } = useQuery<T, AxiosError>({
    queryKey: [path],
    queryFn:  async () => {
      const res = await apiClient.get<T>(path);
      return res.data;
    },
    ...options,
  });

  return {
    data,
    loading: isLoading,
    error:   error ? (error.response?.data as { error?: string })?.error ?? error.message : null,
    refetch,
  };
}
