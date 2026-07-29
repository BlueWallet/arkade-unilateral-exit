import { ESPLORA_URL, type NetworkName } from "@arkade-os/sdk";

/**
 * Resolve the onchain Esplora REST endpoint. Prefers an explicit build-time
 * `VITE_ESPLORA_URL`, otherwise uses the SDK's per-network default — the same
 * constant the SDK's own providers use, so there is no second map to drift.
 *
 * The endpoint must be CORS-permissive (the executor calls it straight from the
 * browser) and expose `/txs/package` for 1P1C relay. Always editable in the UI.
 */
export function esploraUrlFor(network: string | undefined): string {
    const override = import.meta.env.VITE_ESPLORA_URL;
    if (override) return override;
    return ESPLORA_URL[(network ?? "bitcoin") as NetworkName] ?? ESPLORA_URL.bitcoin;
}
