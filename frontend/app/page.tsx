import Link from "next/link";
import { HowItWorks } from "@/components/HowItWorks";
import { Navbar } from "@/components/Navbar";
import { StatsBar } from "@/components/StatsBar";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Match smarter.{" "}
            <span className="text-emerald-400">Pitch faster.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            AI matches your skills to live freelance gigs and writes your
            winning proposal — in under 3 minutes.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={<Link href="/match" />}
              size="lg"
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 sm:w-auto"
            >
              Start Matching →
            </Button>
            <Button
              nativeButton={false}
              render={<a href="#how-it-works" />}
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto"
            >
              See how it works
            </Button>
          </div>
        </section>

        <div className="pb-16">
          <StatsBar />
        </div>

        <HowItWorks />
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Built with Gemini + Llama 3 · Proply © 2026
      </footer>
    </div>
  );
}
