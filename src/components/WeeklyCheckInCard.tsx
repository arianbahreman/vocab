import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dayKey } from "@/lib/vocab";

const labels = ["M", "T", "W", "T", "F", "S", "S"];

export function WeeklyCheckInCard({ reviewDates }: { reviewDates: string[] }) {
  const activeDays = new Set(reviewDates.map((s) => dayKey(new Date(s))));

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 justify-center">
          {weekDays.map((d, i) => {
            const filled = activeDays.has(dayKey(d));
            const isToday = dayKey(d) === dayKey(today);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={
                    `size-9 rounded-full flex items-center justify-center text-sm font-medium ` +
                    (filled
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground") +
                    (isToday ? " ring-2 ring-orange-500" : "")
                  }
                >
                  {filled ? <CheckCircle2 className="size-5" /> : labels[i]}
                </div>
                <span className="text-xs text-muted-foreground">
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
