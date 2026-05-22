import Link from "next/link";
import { Layers } from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Company } from "@/lib/supabase/types";

import { Swiper } from "./_swiper";

export const dynamic = "force-dynamic";

const QUEUE_SIZE = 50;

async function fetchSwipeQueue(): Promise<Company[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("status", "new")
    .order("score", { ascending: false })
    .order("registered_at", { ascending: false, nullsFirst: false })
    .limit(QUEUE_SIZE);

  if (error) {
    throw new Error(`Failed to fetch swipe queue: ${error.message}`);
  }

  return (data ?? []) as Company[];
}

export default async function SwipePage() {
  const leads = await fetchSwipeQueue();

  return (
    <>
      <Topbar
        title="Swipe"
        description="Triage new leads — one at a time, fast"
        actions={
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Layers className="h-3 w-3" />
            {leads.length} in queue
          </Badge>
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden p-6">
        {leads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="max-w-md space-y-3 rounded-xl border border-dashed bg-card/50 px-8 py-12 text-center">
              <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-medium">No new leads</h3>
              <p className="text-sm text-muted-foreground">
                The queue is empty. Run Brreg ingestion from{" "}
                <strong>Queue</strong> to fetch new companies with status
                &quot;new&quot;.
              </p>
              <Link
                href="/admin/queue"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Go to Queue →
              </Link>
            </div>
          </div>
        ) : (
          <Swiper leads={leads} />
        )}
      </div>
    </>
  );
}
