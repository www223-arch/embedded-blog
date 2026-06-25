import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { createAssetStore } from "./asset-store.mjs";
import { ContentStoreError, createContentStore } from "./content-store.mjs";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(serverDirectory, "../../..");
const clientDir = path.resolve(serverDirectory, "../client");
const host = "127.0.0.1";
const port = Number(process.env.CONTENT_STUDIO_PORT || 4174);
const store = createContentStore(rootDir);
const assetStore = createAssetStore(rootDir);

let vite;
const server = http.createServer(async (request, response) => {
  try {
    if (request.url?.startsWith("/api/")) {
      await handleApi(request, response);
      return;
    }

    vite.middlewares(request, response, (error) => {
      if (error) vite.ssrFixStacktrace(error);
      if (error && !response.headersSent) sendError(response, error);
    });
  } catch (error) {
    sendError(response, error);
  }
});

vite = await createViteServer({
  root: clientDir,
  configFile: false,
  appType: "spa",
  publicDir: path.resolve(rootDir, "public"),
  server: {
    middlewareMode: true,
    hmr: { server },
    fs: { allow: [rootDir] }
  }
});

server.listen(port, host, () => {
  console.log(`Content Studio: http://${host}:${port}/`);
});

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${host}:${port}`);

  if (url.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, mode: "editable" });
    return;
  }

  if (url.pathname === "/api/content" && request.method === "GET") {
    const type = url.searchParams.get("type") || undefined;
    sendJson(response, 200, { items: await store.list(type) });
    return;
  }

  const collectionMatch = url.pathname.match(/^\/api\/content\/([^/]+)$/);
  if (collectionMatch && request.method === "POST") {
    const payload = await readJsonBody(request);
    const result = await store.create(decodeURIComponent(collectionMatch[1]), payload);
    sendJson(response, 201, result);
    return;
  }

  const assetMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/([^/]+)$/);
  if (assetMatch && request.method === "GET") {
    const assets = await assetStore.list(decodeURIComponent(assetMatch[1]), decodeURIComponent(assetMatch[2]));
    sendJson(response, 200, { assets });
    return;
  }

  if (assetMatch && request.method === "POST") {
    const payload = await readJsonBody(request, 50_000_000);
    const result = await assetStore.upload(decodeURIComponent(assetMatch[1]), decodeURIComponent(assetMatch[2]), payload);
    sendJson(response, 201, result);
    return;
  }

  if (assetMatch && request.method === "DELETE") {
    const payload = await readJsonBody(request);
    const result = await assetStore.remove(decodeURIComponent(assetMatch[1]), decodeURIComponent(assetMatch[2]), payload);
    sendJson(response, 200, result);
    return;
  }

  const match = url.pathname.match(/^\/api\/content\/([^/]+)\/([^/]+)$/);
  if (match && request.method === "GET") {
    const item = await store.get(decodeURIComponent(match[1]), decodeURIComponent(match[2]));
    if (!item) {
      sendJson(response, 404, { error: { code: "CONTENT_NOT_FOUND", message: "没有找到这项内容。" } });
      return;
    }
    sendJson(response, 200, { item });
    return;
  }

  if (match && request.method === "PUT") {
    const payload = await readJsonBody(request);
    const result = await store.save(decodeURIComponent(match[1]), decodeURIComponent(match[2]), payload);
    sendJson(response, 200, result);
    return;
  }

  sendJson(response, 404, { error: { code: "API_NOT_FOUND", message: "接口不存在。" } });
}

function readJsonBody(request, maxBytes = 2_000_000) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new ContentStoreError("BODY_TOO_LARGE", "请求体过大。", 413));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new ContentStoreError("INVALID_JSON", "请求 JSON 格式不正确。", 400));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, error) {
  const known = error instanceof ContentStoreError;
  const status = known ? error.status : 500;
  const code = known ? error.code : "INTERNAL_ERROR";
  const message = known ? error.message : "本地内容服务发生错误。";
  if (!response.headersSent) sendJson(response, status, { error: { code, message } });
  console.error(error);
}
