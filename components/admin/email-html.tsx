/**
 * Renders the HTML body of an email inside a fully sandboxed iframe.
 *
 * Inbound HTML is attacker-controlled (anyone can mail the reply address),
 * so it must never be injected into the admin page: `sandbox=""` blocks
 * scripts, forms, popups and same-origin access, and the CSP blocks
 * everything except inline styles and images.
 */
export function EmailHtml({ html }: { html: string }) {
  const doc = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'">
<style>body{font:14px/1.5 system-ui,sans-serif;margin:0;padding:4px;color:#222;word-wrap:break-word}img{max-width:100%;height:auto}</style>
</head><body>${html}</body></html>`;
  return (
    <iframe
      title="E-post"
      sandbox=""
      srcDoc={doc}
      className="h-96 w-full resize-y rounded-md border bg-white"
    />
  );
}
