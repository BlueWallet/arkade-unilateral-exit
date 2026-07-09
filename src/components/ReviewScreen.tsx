import type { ExitPackage } from "@arkade-os/sdk";
import { AlertTriangle, ArrowRight, Clock, Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { defaultEsploraFor } from "@/lib/esplora";
import { btc, cn, formatSats, truncateMiddle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
            <span className="tabular text-lg text-ink">{value}</span>
            {hint && <span className="text-[11px] text-ink-dim">{hint}</span>}
        </div>
    );
}

export function ReviewScreen({
    pkg,
    onContinue,
}: {
    pkg: ExitPackage;
    onContinue: (esploraUrl: string) => void;
}) {
    const [esplora, setEsplora] = useState(defaultEsploraFor(pkg.network));
    const active = pkg.vtxos.filter((v) => !v.skipped);
    const skipped = pkg.vtxos.filter((v) => v.skipped);
    const graph = pkg.mode === "graph";

    const expired = useMemo(
        () => (pkg.validUntil ? Date.now() / 1000 > pkg.validUntil : false),
        [pkg.validUntil],
    );
    const hasConditionSweep = active.some((v) => v.path?.startsWith("vhtlc"));

    return (
        <div className="flex flex-col gap-5">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Exit summary</CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="rounded-full border border-line px-2 py-0.5 text-[11px] uppercase tracking-wide text-ink-dim">
                            {pkg.network}
                        </span>
                        <span
                            className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                                graph ? "bg-flight/15 text-flight" : "bg-signal/15 text-signal",
                            )}
                        >
                            {graph ? "graph · you fund" : "funded · keyless"}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                    <Stat label="Transactions" value={String(pkg.totals.txCount)} />
                    <Stat
                        label="Total fees"
                        value={formatSats(pkg.totals.totalFeeSats)}
                        hint={`${pkg.feeRate} sat/vB`}
                    />
                    <Stat
                        label={graph ? "You send" : "Funding needed"}
                        value={formatSats(pkg.totals.fundingRequiredSats)}
                        hint={graph ? "to a throwaway fee address" : "to the fee wallet"}
                    />
                    <Stat
                        label="You recover"
                        value={btc(pkg.totals.recoveredSats)}
                        hint={formatSats(pkg.totals.recoveredSats)}
                    />
                </CardContent>
            </Card>

            {expired && (
                <Warning
                    tone="danger"
                    icon={<Clock className="size-4" />}
                    title="Validity window passed"
                >
                    This package’s <span className="tabular">validUntil</span> has elapsed. The
                    operator may already have swept some branches. Execution will still try — it is
                    harmless — but some steps may conflict.
                </Warning>
            )}

            {hasConditionSweep && (
                <Warning
                    tone="warn"
                    icon={<Eye className="size-4" />}
                    title="Contains condition witnesses"
                >
                    A sweep spends a contract path (e.g. a VHTLC preimage). That secret is embedded
                    in the pre-signed transaction — treat this package as confidential until every
                    step is broadcast.
                </Warning>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Destination &amp; VTXOs</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-dim">Sweep address</span>
                        <span className="tabular text-xs text-ink" title={pkg.sweepAddress}>
                            {truncateMiddle(pkg.sweepAddress, 10, 8)}
                        </span>
                    </div>
                    <div className="divide-y divide-line rounded-[var(--radius)] border border-line">
                        {active.map((v) => (
                            <div
                                key={v.outpoint}
                                className="flex items-center justify-between gap-3 p-3"
                            >
                                <span className="tabular text-xs text-ink-dim" title={v.outpoint}>
                                    {truncateMiddle(v.outpoint, 10, 8)}
                                </span>
                                <div className="flex items-center gap-3 text-xs">
                                    {v.path && (
                                        <span className="rounded bg-panel-2 px-1.5 py-0.5 text-ink-dim">
                                            {v.path}
                                        </span>
                                    )}
                                    {v.delay && (
                                        <span className="text-ink-faint">
                                            +{v.delay.value}{" "}
                                            {v.delay.type === "blocks" ? "blk" : "s"}
                                        </span>
                                    )}
                                    <span className="tabular text-ink">
                                        {formatSats(v.value ?? 0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {skipped.map((v) => (
                            <div
                                key={v.outpoint}
                                className="flex items-center justify-between gap-3 p-3 opacity-60"
                            >
                                <span className="tabular text-xs text-ink-faint" title={v.outpoint}>
                                    {truncateMiddle(v.outpoint, 10, 8)}
                                </span>
                                <span className="text-xs text-dead/80">skipped · {v.skipped}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Esplora endpoint</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <input
                        value={esplora}
                        onChange={(e) => setEsplora(e.target.value)}
                        spellCheck={false}
                        className="w-full rounded-[var(--radius)] border border-line bg-panel/60 p-2.5 font-mono text-xs text-ink focus:border-ink-faint focus:outline-none"
                    />
                    <p className="text-[11px] text-ink-dim">
                        Must be CORS-permissive and expose{" "}
                        <span className="tabular">/txs/package</span>. Defaulted for{" "}
                        <span className="tabular">{pkg.network}</span>.
                    </p>
                </CardContent>
            </Card>

            <Button
                size="lg"
                className="self-end"
                disabled={active.length === 0 || !esplora.trim()}
                onClick={() => onContinue(esplora.trim())}
            >
                {graph ? "Set up funding" : "Begin execution"}
                <ArrowRight />
            </Button>
        </div>
    );
}

function Warning({
    tone,
    icon,
    title,
    children,
}: {
    tone: "warn" | "danger";
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "flex items-start gap-2.5 rounded-[var(--radius)] border p-3 text-sm",
                tone === "danger"
                    ? "border-dead/40 bg-dead/10 text-dead"
                    : "border-wait/40 bg-wait/10 text-wait",
            )}
        >
            <span className="mt-0.5 shrink-0">{icon ?? <AlertTriangle className="size-4" />}</span>
            <div>
                <p className="font-medium">{title}</p>
                <p className="mt-0.5 text-xs opacity-90">{children}</p>
            </div>
        </div>
    );
}
