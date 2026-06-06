import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { handleLocalDbRequest } from './utils/localDb';

// Universal interceptor to handle offline or serverless platform mock fallback
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = (typeof input === 'string') 
    ? input 
    : (input instanceof URL) 
      ? input.toString() 
      : (input && typeof input === 'object' && 'url' in input)
        ? (input as any).url 
        : String(input);

  let isApiRoute = false;
  let pathname = '';
  try {
    const parsedUrl = new URL(urlString, window.location.origin);
    pathname = parsedUrl.pathname;
    isApiRoute = pathname.startsWith('/api/');
  } catch (e) {
    isApiRoute = urlString.includes('/api/');
  }

  if (isApiRoute) {
    // Proactively fallback if hosted on Vercel frontend or static build deployment platforms
    const isStaticDeploy = window.location.hostname.includes('vercel.app') || 
                           window.location.hostname.includes('vercel') ||
                           window.location.hostname.includes('netlify') ||
                           window.location.hostname.includes('github.io');

    if (isStaticDeploy) {
      console.log(`[StudyMind Vercel] Proactively handling ${pathname} via client-side database.`);
      return await handleLocalDbRequest(urlString, init);
    }

    try {
      const response = await originalFetch(input, init);
      const contentType = response.headers.get('content-type') || '';
      
      // Fallback if we get 404, 405, server errors, or standard HTML fallback pages from static routers
      if (!response.ok || response.status === 404 || response.status === 405 || response.status >= 500 || contentType.includes('text/html')) {
        console.warn(`[StudyMind Intercept] Route ${urlString} failed (${response.status}) or returned HTML. Falling back to client-side database.`);
        return await handleLocalDbRequest(urlString, init);
      }
      return response;
    } catch (e) {
      console.warn(`[StudyMind Intercept] Fetch to ${urlString} failed with network error. Falling back to client-side database:`, e);
      return await handleLocalDbRequest(urlString, init);
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

