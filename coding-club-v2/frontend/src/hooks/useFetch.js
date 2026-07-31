import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(url);
      setData(res.data.data || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { refetch(); }, [...deps, refetch]);

  return { data, loading, error, refetch };
}
