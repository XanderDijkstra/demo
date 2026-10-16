import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache binding: every page here is dynamic (admin, per-lead demo sites).
export default defineCloudflareConfig();
