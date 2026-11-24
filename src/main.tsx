import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ThemeProvider } from './app/ThemeProvider';
import { router } from './app/router';
import { hideSplashWhenReady } from './app/splash';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);

// The loading screen in index.html stays up until the app has drawn and the fonts are in.
hideSplashWhenReady();
