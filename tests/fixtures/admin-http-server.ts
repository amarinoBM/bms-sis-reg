import { createServer } from "node:http";
import { createAdminBackend } from "./admin-backend";
let backend = createAdminBackend();
createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:3039");
  if (url.pathname === "/_test/reset") { backend = createAdminBackend(); res.end("ok"); return; }
  if (url.pathname === "/_test/code") {
    const code = String(backend.emails.at(-1)?.body_html).match(/>\s*(\d{6})\s*</)?.[1];
    res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ code })); return;
  }
  if (url.pathname === "/_test/state") {
    res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ audit: backend.audit, writes: backend.writes, records: backend.records })); return;
  }
  if (url.pathname === "/health") { res.end("ok"); return; }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  try {
    const response = await backend.fetch(url, {
      method: req.method, ...(chunks.length ? { body: Buffer.concat(chunks).toString() } : {}),
    });
    res.statusCode = response.status; res.setHeader("Content-Type", "application/json"); res.end(await response.text());
  } catch { res.statusCode = 500; res.end('{"error":"Unsupported fixture request"}'); }
}).listen(3039, "127.0.0.1", () => console.log("Synthetic admin test backend listening on 3039"));
