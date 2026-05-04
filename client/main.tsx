import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import './styles.css';

const qc = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
});

// Surface a session-expiry signal globally: any fetch that 401s clears
// the cached `me` query, which bounces the user back to <Splash/>.
const origFetch = window.fetch;
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const res = await origFetch(...args);
  if (res.status === 401) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    if (url.includes('/api/') && !url.includes('/api/auth/login')) {
      qc.setQueryData(['me'], null);
    }
  }
  return res;
};

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
