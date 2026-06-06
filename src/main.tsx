import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { handleLocalDbRequest } from './utils/localDb';

// Universal interceptor to handle offline or serverless platform mock fallback
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlString = (typeof input === 'string') ? input : (input instanceof URL) ? input.toString() : input.url;

  if (urlString.startsWith('/api/')) {
    try {
      const response = await originalFetch(input, init);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn(`[StudyMind Intercept] Route ${urlString} returned HTML fallback. Running Client DB offline.`);
        return await handleLocalDbRequest(urlString, init);
      }
      return response;
    } catch (e) {
      console.warn(`[StudyMind Intercept] Route ${urlString} failed. Falling back to offline client DB:`, e);
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

