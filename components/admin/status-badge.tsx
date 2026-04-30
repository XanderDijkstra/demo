import { Badge } from "@/components/ui/badge";
import type { CompanyStatus } from "@/lib/supabase/types";

const variant: Record<
  CompanyStatus,
  "default" | "secondary" | "success" | "warning" | "outline" | "destructive"
> = {
  new: "secondary",
  reviewed: "outline",
  qualified: "success",
  rejected: "destructive",
};

const label: Record<CompanyStatus, string> = {
  new: "ny",
  reviewed: "vurdert",
  qualified: "kvalifisert",
  rejected: "avvist",
};

export function StatusBadge({ status }: { status: CompanyStatus }) {
  return <Badge variant={variant[status]}>{label[status]}</Badge>;
}
