import { auth } from './firebase';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function apiRequest(path: string, options: RequestInit = {}) {
  const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');

  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } catch (e) {
      console.warn('Could not retrieve user ID token:', e);
    }
  }

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const maxAttempts = isGet ? 3 : 1;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: options.signal ?? AbortSignal.timeout(12000),
      });

      const contentType = response.headers.get('content-type') || '';

      // If server returned HTML (e.g. warmup page during container boot or 502/503 from proxy)
      if (!contentType.includes('application/json')) {
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
          continue;
        }
        // If it's a GET /api/orders request and the backend returned HTML (e.g. during server boot)
        if (path.startsWith('/api/orders') && isGet) {
          return [];
        }
        throw new Error(`API returned non-JSON response (${response.status}). The server may still be initializing.`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }
      return data;
    } catch (error: any) {
      lastError = error;
      if (error?.name === 'AbortError') throw error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
  }

  // Graceful fallback for orders list if server is temporarily unreachable
  if (path.startsWith('/api/orders') && isGet) {
    return [];
  }

  console.error(`[API ${options.method || 'GET'} ${path}]`, lastError);
  throw lastError;
}

