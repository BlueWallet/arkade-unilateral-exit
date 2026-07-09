import type { NetworkName } from "@arkade-os/sdk";

/**
 * Default Esplora-compatible REST endpoints per network. All must be
 * CORS-permissive (the executor calls them straight from the browser) and
 * expose the `/txs/package` submission route for 1P1C relay. Editable in the
 * UI — these are only the starting points.
 */
export const DEFAULT_ESPLORA: Record<NetworkName, string> = {
    bitcoin: "https://mempool.space/api",
    testnet: "https://mempool.space/testnet/api",
    signet: "https://mempool.space/signet/api",
    mutinynet: "https://mutinynet.com/api",
    regtest: "http://localhost:3000/api",
};

export function defaultEsploraFor(network: NetworkName): string {
    return DEFAULT_ESPLORA[network] ?? DEFAULT_ESPLORA.bitcoin;
}
