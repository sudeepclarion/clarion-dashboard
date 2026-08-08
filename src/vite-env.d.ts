/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLARION_API_URL: string;
  /** @deprecated Prefer dashboard login JWT. Optional service-key bypass. */
  readonly VITE_CLARION_API_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
