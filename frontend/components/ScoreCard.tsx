import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  label: string;
  score: number | null;
  loading?: boolean;
}

export function ScoreCard({ label, score, loading }: ScoreCardProps) {
  return (
    <Card className="flex-1 border-border/60">
      <CardHeader className="pb-1 pt-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            score !== null && score >= 70 && "text-emerald-400",
            score !== null && score >= 50 && score < 70 && "text-amber-400",
            score !== null && score < 50 && "text-red-400"
          )}
        >
          {loading ? "—" : score !== null ? score : "—"}
          <span className="text-sm font-normal text-muted-foreground">
            /100
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
