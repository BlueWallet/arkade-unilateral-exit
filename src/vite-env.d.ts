/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Optional build-time override for the default Esplora endpoint. */
    readonly VITE_ESPLORA_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
