import { Check, Copy } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn, truncateMiddle } from "@/lib/utils";

export function CopyableHash({
    value,
    className,
    head,
    tail,
    copyOnly,
    label,
}: {
    value: string;
    className?: string;
    head?: number;
    tail?: number;
    /** Copy an untruncatable payload (e.g. a whole bundle JSON): show `label`
     * instead of a middle-truncated hash, and keep the copy icon always visible
     * since there is no hash to hover over. */
    copyOnly?: boolean;
    label?: ReactNode;
}) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            // A full bundle is far too long to be a useful native tooltip.
            title={copyOnly ? undefined : value}
            onClick={async () => {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
            }}
            className={cn(
                "group inline-flex items-center gap-1.5 text-xs text-ink-dim hover:text-ink transition-colors",
                !copyOnly && "tabular",
                className,
            )}
        >
            <span>{copyOnly ? (label ?? "Copy") : truncateMiddle(value, head, tail)}</span>
            {copied ? (
                <Check className="size-3 text-ok" />
            ) : (
                <Copy className={cn("size-3", !copyOnly && "opacity-0 group-hover:opacity-100")} />
            )}
        </button>
    );
}
