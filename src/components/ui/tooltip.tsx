import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Explanatory tooltip. Content is plain text — these explain protocol concepts
 * (timelocks, why the sweep address is fixed), so they must stay readable
 * against the dark field rather than inheriting a light default.
 */
export function Tooltip({
    content,
    children,
    side = "top",
    align = "center",
    delayDuration = 200,
    className,
}: {
    content: string;
    children: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    delayDuration?: number;
    className?: string;
}) {
    return (
        <TooltipPrimitive.Provider delayDuration={delayDuration}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        side={side}
                        align={align}
                        sideOffset={6}
                        className={cn(
                            "z-50 max-w-xs rounded-[var(--radius)] border border-line bg-panel-2 px-3 py-1.5 text-xs text-ink shadow-lg",
                            className,
                        )}
                    >
                        {content}
                        <TooltipPrimitive.Arrow className="fill-panel-2" />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    );
}
