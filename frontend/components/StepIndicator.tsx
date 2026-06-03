"use client";

import { cn } from "@/lib/utils";
import type { AppStep } from "@/context/AppContext";

const steps: { num: AppStep; label: string }[] = [
  { num: 1, label: "Profile" },
  { num: 2, label: "Matches" },
  { num: 3, label: "Proposal" },
];

export function StepIndicator({ current }: { current: AppStep }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                current >= s.num
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {s.num}
            </div>
            <span
              className={cn(
                "hidden text-xs sm:block",
                current >= s.num
                  ? "text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-8 sm:w-16",
                current > s.num ? "bg-emerald-500" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
