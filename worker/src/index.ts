export interface Env {
  REDIRECT_KV: KVNamespace;
  API_BASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Skip tracking pixel requests
    if (url.pathname === "/__track") {
      return new Response("ok", { status: 200 });
    }

    // Look up the hostname in KV
    const destination = await env.REDIRECT_KV.get(hostname);

    if (!destination) {
      // No redirect found — maybe it's the dashboard domain itself
      return new Response("Not found", { status: 404 });
    }

    // Track click in the background (fire-and-forget)
    // The KV stores the link ID as metadata
    const linkId = await env.REDIRECT_KV.get(`${hostname}:id`);

    if (linkId) {
      ctx.waitUntil(
        fetch(`${env.API_BASE_URL}/api/links/${linkId}/track-click`, {
          method: "POST",
        }).catch(() => {})
      );
    }

    // 302 redirect
    return Response.redirect(destination, 302);
  },
};
