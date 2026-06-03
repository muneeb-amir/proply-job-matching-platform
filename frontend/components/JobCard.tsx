"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { JobMatch } from "@/lib/api";
import { cn, formatImprovement, truncateText } from "@/lib/utils";

interface JobCardProps {
  job: JobMatch;
  onWriteProposal: (job: JobMatch) => void;
}

function sourceBadgeClass(source: string) {
  if (source.toLowerCase() === "upwork") {
    return "bg-green-500/15 text-green-400 border-green-500/30";
  }
  return "bg-blue-500/15 text-blue-400 border-blue-500/30";
}

export function JobCard({ job, onWriteProposal }: JobCardProps) {
  const improvement = formatImprovement(
    job.match_percentage,
    job.keyword_baseline_score
  );
  return (
    <Card className="flex flex-col border-border/60 transition-opacity hover:border-emerald-500/30">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base leading-snug">
            {job.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn("shrink-0", sourceBadgeClass(job.source))}
          >
            {job.source}
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress
            value={job.match_percentage}
            className={cn(
              "w-full flex-col gap-0",
              "[&_[data-slot=progress-track]]:h-2",
              job.match_percentage >= 70 &&
                "[&_[data-slot=progress-indicator]]:bg-emerald-500",
              job.match_percentage >= 50 &&
                job.match_percentage < 70 &&
                "[&_[data-slot=progress-indicator]]:bg-amber-500",
              job.match_percentage < 50 &&
                "[&_[data-slot=progress-indicator]]:bg-red-500"
            )}
          />
          <p className="text-xs text-muted-foreground">
            AI match: {job.match_percentage}% · Keyword match:{" "}
            {job.keyword_baseline_score}% ·{" "}
            <span className="text-emerald-400">+{improvement}% improvement</span>
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">
          {truncateText(job.description, 120)}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full border-emerald-500/40 hover:bg-emerald-500/10"
          onClick={() => onWriteProposal(job)}
        >
          Write Proposal →
        </Button>
      </CardFooter>
    </Card>
  );
}
