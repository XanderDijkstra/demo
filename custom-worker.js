// Custom Worker entry (wrangler.jsonc `main`): OpenNext's request handler plus the cron triggers.
// Each cron calls its job route through the Worker's own service binding, authenticated with
// CRON_SECRET, exactly as Vercel Cron used to. Everything else goes to OpenNext unchanged.
import handler from './.open-next/worker.js';

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js';

const JOBS = {
  '0 6 * * *': '/api/cron/brreg-daily',
  '0 8 * * *': '/api/cron/outreach-daily',
  '0 9 * * *': '/api/cron/flows',
};

const worker = {
  fetch: handler.fetch,
  async scheduled(event, env, ctx) {
    const path = JOBS[event.cron];
    if (!path) return console.error('Unknown cron', event.cron);
    const origin = (env.APP_URL || 'https://demo.vekst-systemet.no').replace(/\/$/, '');
    ctx.waitUntil(
      env.WORKER_SELF_REFERENCE.fetch(`${origin}${path}`, { headers: { authorization: `Bearer ${env.CRON_SECRET}` } }).then(async response => {
        const body = await response.text();
        if (!response.ok) console.error('Cron failed', path, response.status, body.slice(0, 500));
        else console.log('Cron ok', path, body.slice(0, 500));
      }),
    );
  },
};

export default worker;
