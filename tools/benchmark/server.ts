import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ts": "text/plain; charset=utf-8",
};

export async function startStaticServer(rootDir: string): Promise<{
  close: () => Promise<void>;
  origin: string;
}> {
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    let targetPath = path.join(rootDir, safePath);

    if (pathname.endsWith("/")) {
      targetPath = path.join(rootDir, safePath, "index.html");
    }

    try {
      await access(targetPath);
    } catch {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }

    response.setHeader("Content-Type", MIME_TYPES[path.extname(targetPath)] ?? "application/octet-stream");
    createReadStream(targetPath).pipe(response);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("unable to determine server address");
  }

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
    origin: `http://127.0.0.1:${address.port}`,
  };
}
