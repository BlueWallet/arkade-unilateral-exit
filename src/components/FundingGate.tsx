import { Check, Copy, RefreshCw, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import type { FeeWalletHandle } from "@/lib/feeWallet";
import { resetFeeKey } from "@/lib/feeWallet";
import { formatSats } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/**
 * Graph-mode funding gate: the browser owns a throwaway fee key; the user
 * sends fee sats to its address and we proceed once the deposit confirms.
 */
export function FundingGate({
    fee,
    required,
    onReady,
    onRegenerate,
}: {
    fee: FeeWalletHandle;
    required: number;
    onReady: () => void;
    onRegenerate: () => void;
}) {
    const [balance, setBalance] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        let live = true;
        const poll = async () => {
            try {
                const b = await fee.confirmedBalance();
                if (live) setBalance(b);
            } catch {
                /* endpoint hiccup — keep polling */
            }
        };
        void poll();
        const id = setInterval(poll, 5000);
        return () => {
            live = false;
            clearInterval(id);
        };
    }, [fee]);

    const funded = balance >= required;
    const pct = Math.min(100, required > 0 ? (balance / required) * 100 : 0);

    return (
        <Card>
            <CardHeader className="flex-row items-center gap-2">
                <Wallet className="size-4 text-signal" />
                <CardTitle>Fund the exit</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-ink-dim">
                    Send at least{" "}
                    <span className="tabular font-medium text-ink">{formatSats(required)}</span> to
                    this throwaway fee address. It only ever holds fee sats — never your exited
                    funds — and lives in this browser. Change comes back to it.
                </p>

                <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-line bg-panel-2/60 p-3">
                    <span className="tabular break-all text-xs text-ink">{fee.address}</span>
                    <button
                        type="button"
                        onClick={async () => {
                            await navigator.clipboard.writeText(fee.address);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1200);
                        }}
                        className="shrink-0 text-ink-dim hover:text-ink"
                        title="Copy address"
                    >
                        {copied ? (
                            <Check className="size-4 text-ok" />
                        ) : (
                            <Copy className="size-4" />
                        )}
                    </button>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-ink-dim">Received (confirmed)</span>
                        <span className="tabular text-ink">
                            {formatSats(balance)} / {formatSats(required)}
                        </span>
                    </div>
                    <Progress value={pct} indicatorClassName={funded ? "bg-ok" : "bg-signal"} />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="ghost" onClick={() => setShowKey((s) => !s)}>
                            {showKey ? "Hide" : "Export"} fee key
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                resetFeeKey();
                                onRegenerate();
                            }}
                            title="Discard this fee key and generate a new one"
                        >
                            <RefreshCw className="size-3.5" /> New key
                        </Button>
                    </div>
                    <Button disabled={!funded} onClick={onReady}>
                        {funded ? "Proceed" : "Waiting for deposit…"}
                    </Button>
                </div>

                {showKey && (
                    <p className="tabular break-all rounded border border-line bg-field p-2 text-[11px] text-ink-dim">
                        {fee.privKeyHex}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
