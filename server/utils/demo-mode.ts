/**
 * Server-side demo-mode helpers.
 *
 * Centralises the short-circuit that the `/lite` GET and POST routes need
 * to refuse non-JS submissions on demo.mark-a-spot.com. The lite form is
 * server-rendered HTML that POSTs straight to JSON:API, so the client-side
 * confirmation modal never gets a chance to intercept it. Without this
 * block, a citizen reaching `/lite` on the demo would create a real Drupal
 * node — exactly the bug #432 was filed to close.
 *
 * @see https://github.com/markaspot/markaspot-ui/issues/432
 */
import type { H3Event } from 'h3';

const escapeHtml = (str: string): string =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderDemoLiteHtml = (heading: string, body: string, linkLabel: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Demo only</title>
    <style>
      body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 2rem; max-width: 40rem; }
      a { color: #0f766e; }
      h1 { margin-top: 0; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(body)}</p>
    <p><a href="https://mark-a-spot.com">${escapeHtml(linkLabel)}</a></p>
  </body>
</html>`;

/**
 * Returns the canned HTML page for `/lite` on the demo instance and `null`
 * when the flag is off (caller should continue normally).
 *
 * The handler sets HTTP 451 (Unavailable For Legal Reasons) — the closest
 * IETF status code to "we will not accept this report because it would
 * mislead a citizen". Also pins Content-Type and X-Robots-Tag so the page
 * never ends up indexed.
 */
export const handleDemoLiteShortCircuit = (event: H3Event): string | null => {
    if (useRuntimeConfig(event).public.demoMode !== true) return null;
    setResponseStatus(event, 451);
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8');
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow');
    return renderDemoLiteHtml(
        'Demo instance',
        'This is a demonstration of Mark-a-Spot. Submissions through the lite form are disabled here so that real reports never reach a municipality by accident.',
        'Visit mark-a-spot.com'
    );
};
