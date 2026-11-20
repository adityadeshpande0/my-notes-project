/// <reference types="vite/client" />

declare module 'virtual:content-manifest' {
  const topics: import('./lib/types').TopicMeta[];
  export default topics;
}
