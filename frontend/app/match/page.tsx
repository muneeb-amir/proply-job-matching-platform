"use client";

import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { JobCard } from "@/components/JobCard";
import { Navbar } from "@/components/Navbar";
import { ProposalSheet } from "@/components/ProposalSheet";
import { StepIndicator } from "@/components/StepIndicator";
import { useApp } from "@/context/AppContext";
import { matchJobs } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function MatchPage() {
  const {
    step,
    profile,
    setProfile,
    jobs,
    setJobs,
    setSessionId,
    setStep,
    isMatching,
    setIsMatching,
    selectJob,
    resetToProfile,
  } = useApp();

  const handleMatch = useCallback(async () => {
    if (!profile.skills.trim()) {
      toast.error("Please describe your skills first.");
      return;
    }
    setIsMatching(true);
    setStep(2);
    console.log("[MatchPage] Finding matching jobs…");
    try {
      const result = await matchJobs({
        skills: profile.skills,
        experience_level: profile.experience_level,
        hourly_rate: profile.hourly_rate,
      });
      setJobs(result.jobs);
      setSessionId(result.session_id ?? null);
      if (result.jobs.length === 0) {
        toast.warning("No jobs found. RSS feeds may be temporarily unavailable.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch matches. Check that the backend is running.");
    } finally {
      setIsMatching(false);
    }
  }, [profile, setJobs, setSessionId, setStep, setIsMatching]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar showCta={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <StepIndicator current={step} />

        {step === 1 && (
          <section
            className={cn(
              "mx-auto max-w-xl space-y-6 transition-opacity duration-300",
              "animate-fade-in"
            )}
          >
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold sm:text-3xl">
                Find your next gig
              </h1>
              <p className="mt-2 text-muted-foreground">
                Tell us what you do and we&apos;ll find the best matches
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Your skills</Label>
              <Textarea
                id="skills"
                placeholder="e.g. I'm a Python developer with 2 years experience in FastAPI, ML pipelines, and web scraping..."
                value={profile.skills}
                onChange={(e) => setProfile({ skills: e.target.value })}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Experience level</Label>
              <Select
                value={profile.experience_level}
                onValueChange={(v) =>
                  setProfile({ experience_level: v ?? "intermediate" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Hourly rate (optional)</Label>
              <Input
                id="rate"
                placeholder="$25/hr"
                value={profile.hourly_rate}
                onChange={(e) => setProfile({ hourly_rate: e.target.value })}
              />
            </div>

            <Button
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={handleMatch}
              disabled={isMatching}
            >
              {isMatching ? "Finding jobs…" : "Find Matching Jobs →"}
            </Button>
          </section>
        )}

        {(step === 2 || step === 3) && (
          <section
            className={cn(
              "space-y-6 transition-opacity duration-300",
              "animate-fade-in"
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={resetToProfile}>
                <ArrowLeft className="mr-1 size-4" />
                Back
              </Button>
              <h2 className="text-2xl font-bold">Your matches</h2>
              {!isMatching && (
                <Badge variant="secondary">{jobs.length} jobs found</Badge>
              )}
            </div>

            {isMatching ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-muted-foreground">
                No jobs matched. Try broadening your skills description or check
                back later.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard
                    key={job.url || job.title}
                    job={job}
                    onWriteProposal={selectJob}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <ProposalSheet />
    </div>
  );
}
