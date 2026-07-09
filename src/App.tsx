import type { ExitPackage } from "@arkade-os/sdk";
import { DoorOpen, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ImportScreen } from "@/components/ImportScreen";
import { ReviewScreen } from "@/components/ReviewScreen";
import { RunScreen } from "@/components/RunScreen";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Screen = "import" | "review" | "run";
const STEPS: { id: Screen; label: string }[] = [
    { id: "import", label: "Import" },
    { id: "review", label: "Review" },
    { id: "run", label: "Execute" },
];

export function App() {
    const [screen, setScreen] = useState<Screen>("import");
    const [pkg, setPkg] = useState<ExitPackage | null>(null);
    const [esplora, setEsplora] = useState<string>("");

    const reset = () => {
        setPkg(null);
        setEsplora("");
        setScreen("import");
    };

    const currentIndex = STEPS.findIndex((s) => s.id === screen);

    return (
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-[var(--radius)] border border-signal/30 bg-signal/10">
                        <DoorOpen className="size-4 text-signal" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold tracking-tight text-ink">
                            Arkade Unilateral Exit
                        </h1>
                        <p className="text-[11px] text-ink-dim">
                            keyless executor · your funds, onchain, no operator
                        </p>
                    </div>
                </div>
                {pkg && (
                    <Button variant="ghost" size="sm" onClick={reset}>
                        <RotateCcw className="size-3.5" /> Start over
                    </Button>
                )}
            </header>

            <nav className="mb-8 flex items-center gap-2">
                {STEPS.map((s, i) => (
                    <div key={s.id} className="flex flex-1 items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold tabular",
                                    i < currentIndex && "bg-ok/20 text-ok",
                                    i === currentIndex && "bg-signal text-signal-ink",
                                    i > currentIndex && "border border-line text-ink-faint",
                                )}
                            >
                                {i + 1}
                            </span>
                            <span
                                className={cn(
                                    "text-xs",
                                    i === currentIndex ? "text-ink" : "text-ink-faint",
                                )}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <span
                                className={cn(
                                    "h-px flex-1",
                                    i < currentIndex ? "bg-ok/40" : "bg-line",
                                )}
                            />
                        )}
                    </div>
                ))}
            </nav>

            <main className="flex-1">
                {screen === "import" && (
                    <ImportScreen
                        onImport={(p) => {
                            setPkg(p);
                            setScreen("review");
                        }}
                    />
                )}
                {screen === "review" && pkg && (
                    <ReviewScreen
                        pkg={pkg}
                        onContinue={(url) => {
                            setEsplora(url);
                            setScreen("run");
                        }}
                    />
                )}
                {screen === "run" && pkg && esplora && <RunScreen pkg={pkg} esploraUrl={esplora} />}
            </main>

            <footer className="mt-10 border-t border-line pt-4 text-[11px] text-ink-faint">
                Runs entirely in your browser. Package secrets never leave this page except as
                transactions broadcast to your chosen Esplora endpoint.
            </footer>
        </div>
    );
}
