import type { QueryClient } from '@tanstack/react-query';

/**
 * Fetch wrapper that treats a 401 as "session is gone" — clears the
 * cached `me` query so the App re-renders to <Splash/>. Throws for
 * everything else; callers handle their own error states.
 */
export async function api(
  input: string,
  init: RequestInit = {},
  qc?: QueryClient,
): Promise<Response> {
  const res = await fetch(input, { credentials: 'include', ...init });
  if (res.status === 401 && qc) {
    qc.setQueryData(['me'], null);
    qc.invalidateQueries();
  }
  return res;
}
