
import { auth } from './firebase';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).replace(/\/$/, '');

export async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const fullUrl = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  // Send the signed-in user's Firebase ID token.
  const user = auth.currentUser;

  if (user) {
    try {
      const token = await user.getIdToken();

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.error('[API] Failed to obtain Firebase ID token', error);
      throw new Error(
        'Your login session could not be verified. Please sign in again.'
      );
    }
  }

  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const maxAttempts = isGet ? 3 : 1;

  let lastError: Error = new Error('API request failed.');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: options.signal ?? AbortSignal.timeout(12000),
      });

      const contentType =
        response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const error = new Error(
          `Backend returned a non-JSON response (${response.status}).`
        );

        if (isGet && attempt < maxAttempts && response.status >= 500) {
          lastError = error;
          await new Promise(resolve =>
            setTimeout(resolve, 800 * attempt)
          );
          continue;
        }

        throw error;
      }

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(
          typeof data?.error === 'string'
            ? data.error
            : `API request failed (${response.status}).`
        );

        // Retry only temporary server failures on GET requests.
        if (isGet && response.status >= 500 && attempt < maxAttempts) {
          lastError = error;
          await new Promise(resolve =>
            setTimeout(resolve, 800 * attempt)
          );
          continue;
        }

        throw error;
      }

      return data;
    } catch (error: any) {
      lastError =
        error instanceof Error
          ? error
          : new Error('Network request failed.');

      // Do not retry authentication, validation,
      // or other explicit HTTP errors.
      if (
        lastError.message.startsWith('API request failed (') ||
        lastError.message.startsWith('Backend returned') ||
        lastError.message.includes('Unauthorized') ||
        lastError.message.includes('Store owner access') ||
        lastError.message.includes('Database')
      ) {
        throw lastError;
      }

      if (!isGet || attempt === maxAttempts) {
        throw lastError;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 800 * attempt)
      );
    }
  }

  throw lastError;
}
