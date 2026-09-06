import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const portFlag = process.argv.indexOf("--port");
const port = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 4173;
const root = join(process.cwd(), "dist");
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json"], [".svg", "image/svg+xml"],
  [".png", "image/png"], [".jpg", "image/jpeg"], [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"], [".txt", "text/plain; charset=utf-8"]
]);

function sendFile(response, path, status = 200) {
  response.writeHead(status, {
    "Content-Type": mimeTypes.get(extname(path)) || "application/octet-stream",
    "Cache-Control": path.includes("/assets/index-") ? "public, max-age=31536000, immutable" : "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  });
  createReadStream(path).pipe(response);
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/" || pathname === "/demo") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";
  const candidate = normalize(join(root, pathname));
  if (!candidate.startsWith(`${root}/`)) {
    sendFile(response, join(root, "404.html"), 404);
    return;
  }
  try {
    if ((await stat(candidate)).isFile()) {
      sendFile(response, candidate);
      return;
    }
  } catch { /* the designed 404 below handles missing files */ }
  sendFile(response, join(root, "404.html"), 404);
}).listen(port, "0.0.0.0", () => console.log(`Hookback preview: http://127.0.0.1:${port}`));
