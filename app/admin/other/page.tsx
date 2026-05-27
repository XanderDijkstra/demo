import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface Tool {
  href: string;
  title: string;
  description: string;
  icon: typeof Layers;
}

const TOOLS: Tool[] = [
  {
    href: "/admin/swipe",
    title: "Swipe",
    description:
      "Tinder-style triage of new leads. Keyboard-first: ← reject, → qualify, ↑ skip, C send to CRM.",
    icon: Layers,
  },
];

export default function OtherPage() {
  return (
    <>
      <Topbar
        title="Other"
        description="Secondary tools — kept out of the main nav for now"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href as never}
                className="group block focus:outline-hidden"
              >
                <Card className="h-full transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <CardTitle className="mt-3 text-base">
                      {tool.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
