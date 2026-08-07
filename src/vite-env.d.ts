/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLARION_API_URL: string;
  readonly VITE_CLARION_API_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
