import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "78% match accuracy",
    subtext: "vs 41% keyword search",
  },
  {
    title: "~3 min per proposal",
    subtext: "vs 25 min manual",
  },
  {
    title: "Free to use",
    subtext: "No signup required",
  },
];

export function StatsBar() {
  return (
    <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3 sm:px-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-emerald-400">
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{stat.subtext}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
