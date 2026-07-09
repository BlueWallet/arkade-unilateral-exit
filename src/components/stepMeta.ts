import type { ExecutorEvent, ExitStep } from "@arkade-os/sdk";

export type StepPhase = "pending" | "active" | "confirmed" | "waiting" | "failed" | "skipped";

/** Human labels for each transported step kind. */
export const KIND_LABEL: Record<ExitStep["kind"], string> = {
    broadcast: "Fund splitter",
    package: "Unroll (pre-funded)",
    bump: "Unroll (fee-bumped)",
    sweep: "Sweep to destination",
};

/** Map a live executor status to a display phase. */
export function phaseFor(status: ExecutorEvent["status"]): StepPhase {
    switch (status) {
        case "confirmed":
            return "confirmed";
        case "failed":
            return "failed";
        case "skipped":
            return "confirmed"; // already onchain — treat as done
        case "waiting_csv":
            return "waiting";
        case "warning":
        case "broadcast":
            return "active";
    }
}

export const PHASE_STYLE: Record<
    StepPhase,
    { dot: string; ring: string; label: string; text: string }
> = {
    pending: { dot: "bg-ink-faint", ring: "border-line", label: "Pending", text: "text-ink-faint" },
    active: {
        dot: "bg-flight pulse",
        ring: "border-flight",
        label: "In flight",
        text: "text-flight",
    },
    waiting: {
        dot: "bg-wait",
        ring: "border-wait",
        label: "Waiting for timelock",
        text: "text-wait",
    },
    confirmed: { dot: "bg-ok", ring: "border-ok", label: "Confirmed", text: "text-ok" },
    failed: { dot: "bg-dead", ring: "border-dead", label: "Failed", text: "text-dead" },
    skipped: {
        dot: "bg-ok/60",
        ring: "border-ok/40",
        label: "Already onchain",
        text: "text-ok/70",
    },
};
