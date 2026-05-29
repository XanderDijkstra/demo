"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveBrregCronSettings } from "./_actions";

interface CronSettingsFormProps {
  initialEnabled: boolean;
  initialDayOffset: number;
  schedule: string;
}

export function CronSettingsForm({
  initialEnabled,
  initialDayOffset,
  schedule,
}: CronSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [dayOffset, setDayOffset] = useState(String(initialDayOffset));
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveBrregCronSettings(formData);
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Schedule</span>
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {schedule}
          </code>
          <span className="text-muted-foreground">UTC daily</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status</span>
          {enabled ? (
            <Badge variant="success" className="text-[10px]">
              aktiv
            </Badge>
          ) : (
            <Badge variant="warning" className="text-[10px]">
              pauset
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="cron-enabled">
            Cron aktiv
          </Label>
          <label
            htmlFor="cron-enabled"
            className="inline-flex items-center gap-2 text-sm"
          >
            <input
              id="cron-enabled"
              name="enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={pending}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-muted-foreground">
              Skipper daglig run hvis avhuket
            </span>
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cron-day-offset" className="text-xs">
            Måldato (dager tilbake)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="cron-day-offset"
              name="day_offset"
              type="number"
              min={0}
              max={365}
              step={1}
              value={dayOffset}
              onChange={(e) => setDayOffset(e.target.value)}
              className="w-24 tabular-nums"
              disabled={pending}
            />
            <span className="text-xs text-muted-foreground">
              1 = gårsdagen (default)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <p>
          Endringer trer i kraft umiddelbart — neste cron leser settings før
          den kjører. Schedule (klokkeslett) styres i{" "}
          <code className="font-mono">vercel.json</code>.
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save
        </Button>
      </div>
    </form>
  );
}
