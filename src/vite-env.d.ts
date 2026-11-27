/// <reference types="vite/client" />

declare module 'virtual:content-manifest' {
  const topics: import('./lib/types').TopicMeta[];
  export default topics;
}

// Settings read at build time (set them in Vercel → Project → Settings →
// Environment Variables, or in a local .env file). See .env.example.
interface ImportMetaEnv {
  /** PostHog project API key ("phc_…"). Leave unset to turn PostHog off. */
  readonly VITE_POSTHOG_KEY?: string;
  /** Where events are sent. Defaults to "/ingest" (proxied by vercel.json). */
  readonly VITE_POSTHOG_HOST?: string;
  /** The PostHog app, for links in the toolbar. Defaults to https://us.posthog.com. */
  readonly VITE_POSTHOG_UI_HOST?: string;
}
