import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/** Short middle-truncation for txids / addresses, e.g. `a1b2…9f0e`. */
export function truncateMiddle(s: string, head = 8, tail = 6): string {
    if (s.length <= head + tail + 1) return s;
    return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/** Format satoshis with thin-space grouping and a ₿ suffix in whole BTC hint. */
export function formatSats(sats: number): string {
    return `${sats.toLocaleString("en-US")} sats`;
}

export function btc(sats: number): string {
    return `${(sats / 1e8).toLocaleString("en-US", { maximumFractionDigits: 8 })} BTC`;
}
