/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_API?: string;
  // add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
