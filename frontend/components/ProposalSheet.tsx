"use client";

import { useCallback } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { generateProposal, scoreProposal } from "@/lib/api";
import { ScoreCard } from "@/components/ScoreCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { cn, truncateText } from "@/lib/utils";
import type { ProposalTone } from "@/lib/api";

const tones: { value: ProposalTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "concise", label: "Concise" },
];

export function ProposalSheet() {
  const {
    sheetOpen,
    setSheetOpen,
    closeSheet,
    selectedJob,
    profile,
    proposal,
    setProposal,
    proposalTone,
    setProposalTone,
    scores,
    setScores,
    isGenerating,
    setIsGenerating,
    isScoring,
    setIsScoring,
    sessionId,
    proposalId,
    setProposalId,
  } = useApp();

  const handleGenerate = useCallback(async () => {
    if (!selectedJob) return;
    setIsGenerating(true);
    setScores(null);
    try {
      console.log("[ProposalSheet] Generating proposal…");
      const result = await generateProposal({
        session_id: sessionId,
        job_title: selectedJob.title,
        job_description: selectedJob.description,
        user_skills: profile.skills,
        user_experience: profile.experience_level,
        tone: proposalTone,
      });
      setProposal(result.proposal);
      setProposalId(result.proposal_id ?? null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate proposal. Is the backend running?");
    } finally {
      setIsGenerating(false);
    }
  }, [
    selectedJob,
    profile,
    proposalTone,
    sessionId,
    setProposalId,
    setProposal,
    setScores,
    setIsGenerating,
  ]);

  const handleScore = useCallback(async () => {
    if (!selectedJob || !proposal.trim()) return;
    setIsScoring(true);
    try {
      console.log("[ProposalSheet] Scoring proposal…");
      const result = await scoreProposal({
        proposal_id: proposalId,
        proposal,
        job_description: selectedJob.description,
      });
      setScores(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to score proposal.");
    } finally {
      setIsScoring(false);
    }
  }, [selectedJob, proposal, proposalId, setScores, setIsScoring]);

  const handleCopy = useCallback(async () => {
    if (!proposal) return;
    await navigator.clipboard.writeText(proposal);
    toast.success("Proposal copied!");
  }, [proposal]);

  if (!selectedJob) return null;

  return (
    <Sheet
      open={sheetOpen}
      onOpenChange={(open) => {
        setSheetOpen(open);
        if (!open) closeSheet();
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-8 line-clamp-2">{selectedJob.title}</SheetTitle>
          <SheetDescription>
            {truncateText(selectedJob.description, 80)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-8">
          <div className="flex flex-wrap gap-2">
            {tones.map((t) => (
              <Toggle
                key={t.value}
                variant="outline"
                pressed={proposalTone === t.value}
                onPressedChange={(pressed) => {
                  if (pressed) setProposalTone(t.value);
                }}
                className={cn(
                  proposalTone === t.value &&
                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                )}
              >
                {t.label}
              </Toggle>
            ))}
          </div>

          <Button
            className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating…" : "Generate Proposal →"}
          </Button>

          {isGenerating ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Your generated proposal will appear here…"
              className="min-h-[200px] resize-y"
            />
          )}

          <div className="grid grid-cols-3 gap-2">
            <ScoreCard
              label="Relevance"
              score={scores?.relevance ?? null}
              loading={isScoring}
            />
            <ScoreCard
              label="Specificity"
              score={scores?.specificity ?? null}
              loading={isScoring}
            />
            <ScoreCard
              label="CTA Strength"
              score={scores?.cta_strength ?? null}
              loading={isScoring}
            />
          </div>

          {scores?.tip && (
            <p className="text-xs text-muted-foreground italic">{scores.tip}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleScore}
              disabled={isScoring || !proposal.trim()}
            >
              {isScoring ? "Scoring…" : "Score my proposal"}
            </Button>
            <Button variant="ghost" onClick={handleCopy} disabled={!proposal}>
              <Copy className="mr-2 size-4" />
              Copy to clipboard
            </Button>
          </div>

          <Badge className="w-fit bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">
            ⏱ ~22 minutes saved
          </Badge>
        </div>
      </SheetContent>
    </Sheet>
  );
}
