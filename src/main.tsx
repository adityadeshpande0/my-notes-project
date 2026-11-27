import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './app/ThemeProvider';
import { router } from './app/router';
import { hideSplashWhenReady } from './app/splash';
import { initAnalytics } from './lib/analytics';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
      {/* Vercel Web Analytics: page views and visitors, cookie-free. It also
          notices route changes on its own. Does nothing outside Vercel. */}
      <Analytics />
    </ThemeProvider>
  </StrictMode>,
);

// The loading screen in index.html stays up until the app has drawn and the fonts are in.
hideSplashWhenReady();

// PostHog (detailed events) loads later, when the browser is idle. See lib/analytics.ts.
initAnalytics();
