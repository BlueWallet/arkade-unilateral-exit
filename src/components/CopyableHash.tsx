import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn, truncateMiddle } from "@/lib/utils";

export function CopyableHash({
    value,
    className,
    head,
    tail,
}: {
    value: string;
    className?: string;
    head?: number;
    tail?: number;
}) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            title={value}
            onClick={async () => {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
            }}
            className={cn(
                "group inline-flex items-center gap-1.5 tabular text-xs text-ink-dim hover:text-ink transition-colors",
                className,
            )}
        >
            <span>{truncateMiddle(value, head, tail)}</span>
            {copied ? (
                <Check className="size-3 text-ok" />
            ) : (
                <Copy className="size-3 opacity-0 group-hover:opacity-100" />
            )}
        </button>
    );
}
