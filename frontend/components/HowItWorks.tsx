import { ClipboardPaste, PenLine, Sparkles } from "lucide-react";

const steps = [
  {
    step: "1",
    title: "Paste your skills",
    description: "Describe what you do in a few lines",
    icon: ClipboardPaste,
  },
  {
    step: "2",
    title: "Get matched",
    description: "AI finds the best-fit gigs from Upwork & Freelancer",
    icon: Sparkles,
  },
  {
    step: "3",
    title: "Generate your pitch",
    description: "One click writes a tailored proposal",
    icon: PenLine,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6"
    >
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
        How it works
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="rounded-xl border border-border/60 bg-card/40 p-6 text-center transition-opacity hover:opacity-95"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
