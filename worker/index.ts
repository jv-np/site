export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Cloudflare",
      });
    }

    if (url.pathname.startsWith("/media/")) {
      return serveMedia(request, env);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function serveMedia(request: Request, env: Env): Promise<Response> {
  const key = decodeURIComponent(
    new URL(request.url).pathname.slice("/media/".length),
  );
  if (!key) return new Response(null, { status: 404 });

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const range = parseRange(request.headers.get("Range"));
  const onlyIf = parseOnlyIf(request.headers);

  const object = await env.MEDIA.get(key, {
    range: range ?? undefined,
    onlyIf,
  });

  if (!object) {
    // Either missing or precondition failed (304).
    const head = await env.MEDIA.head(key);
    if (head && onlyIf) {
      return new Response(null, {
        status: 304,
        headers: buildHeaders(head, null),
      });
    }
    return new Response(null, { status: 404 });
  }

  const headers = buildHeaders(object, range);
  const status = range ? 206 : 200;
  const body = request.method === "HEAD" ? null : object.body;
  return new Response(body, { status, headers });
}

type ParsedRange = { offset: number; length: number };

function parseRange(header: string | null): ParsedRange | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const startStr = match[1];
  const endStr = match[2];
  if (startStr === "" && endStr === "") return null;
  if (startStr === "") {
    // Suffix range: last N bytes. R2 supports { suffix } but we keep it simple.
    const suffix = Number(endStr);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    // Caller will resolve via head.
    return { offset: -1, length: suffix };
  }
  const offset = Number(startStr);
  if (!Number.isFinite(offset) || offset < 0) return null;
  if (endStr === "") return { offset, length: Number.MAX_SAFE_INTEGER };
  const end = Number(endStr);
  if (!Number.isFinite(end) || end < offset) return null;
  return { offset, length: end - offset + 1 };
}

function parseOnlyIf(headers: Headers): R2Conditional | undefined {
  const etag = headers.get("If-None-Match");
  if (!etag) return undefined;
  return { etagDoesNotMatch: etag.replace(/^W\//, "").replace(/"/g, "") };
}

function buildHeaders(
  object: R2Object,
  range: ParsedRange | null,
): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", headers.get("Cache-Control") ?? "public, max-age=31536000, immutable");
  if (range) {
    const total = object.size;
    const start = range.offset === -1 ? Math.max(total - range.length, 0) : range.offset;
    const end = Math.min(start + Math.min(range.length, total - start) - 1, total - 1);
    headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
    headers.set("Content-Length", String(end - start + 1));
  } else {
    headers.set("Content-Length", String(object.size));
  }
  return headers;
}
