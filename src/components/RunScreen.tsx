import {
    EsploraProvider,
    UnilateralExit,
    type ExecutorEvent,
    type ExitPackage,
} from "@arkade-os/sdk";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadOrCreateFeeKey, makeFeeWallet, type FeeWalletHandle } from "@/lib/feeWallet";
import { KIND_LABEL, PHASE_STYLE, phaseFor, type StepPhase } from "@/components/stepMeta";
import { CopyableHash } from "@/components/CopyableHash";
import { FundingGate } from "@/components/FundingGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type RunPhase = "funding" | "running";

export function RunScreen({ pkg, esploraUrl }: { pkg: ExitPackage; esploraUrl: string }) {
    const graph = pkg.mode === "graph";
    const [phase, setPhase] = useState<RunPhase>(graph ? "funding" : "running");
    const [fee, setFee] = useState<FeeWalletHandle | null>(null);
    const [feeKeyNonce, setFeeKeyNonce] = useState(0);

    const provider = useMemo(() => new EsploraProvider(esploraUrl), [esploraUrl]);

    // Build the ephemeral fee wallet for graph mode.
    useEffect(() => {
        if (!graph) return;
        let live = true;
        void makeFeeWallet(loadOrCreateFeeKey(), pkg.network, esploraUrl).then((f) => {
            if (live) setFee(f);
        });
        return () => {
            live = false;
        };
    }, [graph, pkg.network, esploraUrl, feeKeyNonce]);

    if (phase === "funding") {
        if (!fee) return <Centered>Preparing fee wallet…</Centered>;
        return (
            <FundingGate
                fee={fee}
                required={pkg.totals.fundingRequiredSats}
                onReady={() => setPhase("running")}
                onRegenerate={() => setFeeKeyNonce((n) => n + 1)}
            />
        );
    }

    return <ExecutionTimeline pkg={pkg} provider={provider} feeWallet={fee?.wallet} />;
}

function ExecutionTimeline({
    pkg,
    provider,
    feeWallet,
}: {
    pkg: ExitPackage;
    provider: EsploraProvider;
    feeWallet?: FeeWalletHandle["wallet"];
}) {
    const [events, setEvents] = useState<Map<number, ExecutorEvent>>(new Map());
    const [warnings, setWarnings] = useState<string[]>([]);
    const [done, setDone] = useState(false);
    const [fatal, setFatal] = useState<string | null>(null);
    const [tipHeight, setTipHeight] = useState<number | null>(null);
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return; // guard StrictMode double-invoke
        started.current = true;
        const executor = new UnilateralExit.Executor(pkg, provider, {
            feeWallet,
            pollIntervalMs: 4000,
        });
        (async () => {
            try {
                for await (const ev of executor) {
                    if (ev.stepIndex < 0) {
                        if (ev.reason) setWarnings((w) => [...w, ev.reason!]);
                        continue;
                    }
                    setEvents((prev) => new Map(prev).set(ev.stepIndex, ev));
                }
                setDone(true);
            } catch (e) {
                setFatal(e instanceof Error ? e.message : String(e));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Poll chain tip while any sweep is waiting, to show a live block countdown.
    const anyWaiting = [...events.values()].some((e) => e.status === "waiting_csv");
    useEffect(() => {
        if (!anyWaiting) return;
        let live = true;
        const poll = async () => {
            try {
                const tip = await provider.getChainTip();
                if (live) setTipHeight(tip.height);
            } catch {
                /* ignore */
            }
        };
        void poll();
        const id = setInterval(poll, 5000);
        return () => {
            live = false;
            clearInterval(id);
        };
    }, [anyWaiting, provider]);

    const confirmed = pkg.steps.filter(
        (_, i) => events.get(i)?.status === "confirmed" || events.get(i)?.status === "skipped",
    ).length;
    const failed = [...events.values()].filter((e) => e.status === "failed").length;
    const pct = pkg.steps.length ? (confirmed / pkg.steps.length) * 100 : 0;

    return (
        <div className="flex flex-col gap-5">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>
                        {done
                            ? failed
                                ? "Finished with failures"
                                : "Exit complete"
                            : "Executing exit"}
                    </CardTitle>
                    <StatusPill done={done} failed={failed} />
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-ink-dim">
                        <span>
                            {confirmed} / {pkg.steps.length} transactions onchain
                        </span>
                        {failed > 0 && <span className="text-dead">{failed} failed</span>}
                    </div>
                    <Progress
                        value={pct}
                        indicatorClassName={failed ? "bg-dead" : done ? "bg-ok" : "bg-signal"}
                    />
                </CardContent>
            </Card>

            {warnings.map((w, i) => (
                <div
                    key={i}
                    className="flex items-start gap-2 rounded-[var(--radius)] border border-wait/40 bg-wait/10 p-3 text-xs text-wait"
                >
                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{w}</span>
                </div>
            ))}

            {fatal && (
                <div className="rounded-[var(--radius)] border border-dead/40 bg-dead/10 p-3 text-sm text-dead">
                    Executor stopped: {fatal}
                </div>
            )}

            <ol className="flex flex-col">
                {pkg.steps.map((step, i) => (
                    <TimelineRow
                        key={i}
                        index={i}
                        last={i === pkg.steps.length - 1}
                        kindLabel={KIND_LABEL[step.kind]}
                        txid={
                            "txid" in step ? step.txid : (step as { parentTxid: string }).parentTxid
                        }
                        event={events.get(i)}
                        tipHeight={tipHeight}
                    />
                ))}
            </ol>
        </div>
    );
}

function TimelineRow({
    index,
    last,
    kindLabel,
    txid,
    event,
    tipHeight,
}: {
    index: number;
    last: boolean;
    kindLabel: string;
    txid: string;
    event?: ExecutorEvent;
    tipHeight: number | null;
}) {
    const phase: StepPhase = event ? phaseFor(event.status) : "pending";
    const s = PHASE_STYLE[phase];
    const blocksLeft =
        event?.status === "waiting_csv" && event.maturesAtHeight && tipHeight !== null
            ? Math.max(0, event.maturesAtHeight - tipHeight)
            : null;

    return (
        <li className="flex gap-3">
            <div className="flex flex-col items-center">
                <span
                    className={cn(
                        "mt-1 flex size-3.5 items-center justify-center rounded-full border-2 bg-field",
                        s.ring,
                    )}
                >
                    <span className={cn("size-1.5 rounded-full", s.dot)} />
                </span>
                {!last && <span className="w-px flex-1 bg-line" />}
            </div>
            <div className="flex flex-1 items-start justify-between gap-3 pb-6">
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-ink">
                        <span className="text-ink-faint tabular">{index + 1}.</span> {kindLabel}
                    </span>
                    <CopyableHash value={txid} />
                    {event?.reason && phase === "failed" && (
                        <span className="text-xs text-dead/80">{event.reason}</span>
                    )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                    <span className={cn("text-xs font-medium", s.text)}>{s.label}</span>
                    {blocksLeft !== null && (
                        <span className="tabular text-[11px] text-wait">
                            ~{blocksLeft} block{blocksLeft === 1 ? "" : "s"} left
                        </span>
                    )}
                </div>
            </div>
        </li>
    );
}

function StatusPill({ done, failed }: { done: boolean; failed: number }) {
    if (!done)
        return (
            <span className="flex items-center gap-1.5 text-xs text-flight">
                <Loader2 className="size-3.5 animate-spin" /> running
            </span>
        );
    if (failed)
        return (
            <span className="flex items-center gap-1.5 text-xs text-dead">
                <CircleAlert className="size-3.5" /> partial
            </span>
        );
    return (
        <span className="flex items-center gap-1.5 text-xs text-ok">
            <CheckCircle2 className="size-3.5" /> done
        </span>
    );
}

function Centered({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-dim">
            <Loader2 className="size-4 animate-spin" /> {children}
        </div>
    );
}
